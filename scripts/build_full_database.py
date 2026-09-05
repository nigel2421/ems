import csv
import re
import json
import sqlite3
import os

def build_full_database():
    csv_path = 'results.csv'
    sqlite_path = 'ems_database.sqlite'
    json_path = os.path.join('src', 'data', 'iebcGeographyData.json')

    print(f"Reading {csv_path}...")
    with open(csv_path, 'r', encoding='utf-8-sig', errors='replace') as f:
        reader = csv.DictReader(f)
        pages = list(reader)

    ps_code_pattern = re.compile(r'(\d{15})')
    # Regex to handle characters, spaces, backslashes, quotes, hyphens, slashes, dots
    before_pattern = re.compile(
        r'^([A-Z\s\'\-\./\\]+?)\s*(\d{3})\s*([A-Z\s\'\-\./\\]+?)\s*(\d{4})\s*([A-Z\s\'\-\./\\]+?)\s*(\d{3})\s*(.*)$',
        re.IGNORECASE
    )

    counties_dict = {}
    constituencies_dict = {}
    wards_dict = {}
    polling_stations_list = []

    parsed_count = 0
    unparsed_before_count = 0

    for page in pages:
        text = page.get('extracted_text', '')
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if not line or 'REGISTERED VOTERS' in line or 'County Name' in line or 'Page ' in line:
                continue

            matches = list(ps_code_pattern.finditer(line))
            if not matches:
                continue
            
            m = matches[0]
            ps_code = m.group(1)
            before_code = line[:m.start()].strip()
            after_code = line[m.end():].strip()

            c_code_m = re.match(r'^(\d{3})', before_code)
            if not c_code_m:
                continue
            
            county_code_digits = c_code_m.group(1)
            rem_before = before_code[3:].strip()

            # Voter count at end of line / after_code
            voter_match = re.search(r'([\d\s]+)$', after_code)
            voters = 0
            ps_name = after_code
            if voter_match:
                v_str = voter_match.group(1).replace(' ', '')
                if v_str.isdigit():
                    voters = int(v_str)
                    ps_name = after_code[:voter_match.start()].strip()

            # Clean name
            ps_name = ps_name.strip()

            bm = before_pattern.match(rem_before)
            if bm:
                county_name = bm.group(1).strip()
                const_code = bm.group(2).strip()
                const_name = bm.group(3).strip()
                ward_code = bm.group(4).strip()
                ward_name = bm.group(5).strip()
                reg_center_code = bm.group(6).strip()
                reg_center_name = bm.group(7).strip()
            else:
                unparsed_before_count += 1
                county_name = "UNKNOWN"
                const_code = ps_code[3:6]
                const_name = f"CONST-{const_code}"
                ward_code = ps_code[6:10]
                ward_name = f"WARD-{ward_code}"
                reg_center_code = ps_code[10:13]
                reg_center_name = ps_name

            # County mapping
            c_num = str(int(county_code_digits))
            county_id = f"C-{int(county_code_digits):03d}"
            if county_id not in counties_dict:
                counties_dict[county_id] = {
                    'id': county_id,
                    'code': c_num,
                    'name': county_name.upper(),
                    'registeredVoters': 0,
                    'constituenciesSet': set()
                }
            counties_dict[county_id]['registeredVoters'] += voters
            counties_dict[county_id]['constituenciesSet'].add(const_code)

            # Constituency mapping
            const_num = str(int(const_code))
            const_key = f"{county_id}_CONST-{int(const_code):03d}"
            const_id = f"CONST-{int(const_code):03d}"
            if const_key not in constituencies_dict:
                constituencies_dict[const_key] = {
                    'id': const_id,
                    'countyId': county_id,
                    'code': const_num,
                    'name': const_name.upper(),
                    'registeredVoters': 0,
                    'wardsSet': set(),
                    'const_key': const_key
                }
            constituencies_dict[const_key]['registeredVoters'] += voters
            constituencies_dict[const_key]['wardsSet'].add(ward_code)

            # Ward mapping
            ward_num = str(int(ward_code))
            ward_key = f"{const_key}_WARD-{int(ward_code):04d}"
            ward_id = f"WARD-{int(ward_code):04d}"
            if ward_key not in wards_dict:
                wards_dict[ward_key] = {
                    'id': ward_id,
                    'constituencyId': const_id,
                    'countyId': county_id,
                    'code': ward_num,
                    'name': ward_name.upper(),
                    'registeredVoters': 0,
                    'pollingStationsCount': 0,
                    'ward_key': ward_key
                }
            wards_dict[ward_key]['registeredVoters'] += voters
            wards_dict[ward_key]['pollingStationsCount'] += 1

            parsed_count += 1
            formatted_ps_code = f"{int(county_code_digits):03d}/{int(const_code):03d}/{int(ward_code):04d}/{ps_code[-5:]}"

            # If ps_name is blank, fall back to reg_center_name
            final_ps_name = ps_name if ps_name else reg_center_name

            polling_stations_list.append({
                'id': f"PS-{parsed_count}",
                'wardId': ward_id,
                'constituencyId': const_id,
                'countyId': county_id,
                'code': formatted_ps_code,
                'name': final_ps_name,
                'registeredVoters': voters,
                'psCode15': ps_code
            })

    print(f"Extracted {parsed_count} polling stations across {len(counties_dict)} counties, {len(constituencies_dict)} constituencies, {len(wards_dict)} wards.")
    total_voters = sum(c['registeredVoters'] for c in counties_dict.values())
    print(f"Total Registered Voters: {total_voters:,}")

    # Build JSON Structure
    json_counties = []
    for c_id in sorted(counties_dict.keys()):
        c = counties_dict[c_id]
        json_counties.append({
            'id': c['id'],
            'name': c['name'],
            'code': c['code'],
            'registeredVoters': c['registeredVoters'],
            'constituenciesCount': len(c['constituenciesSet'])
        })

    json_constituencies = []
    for c_key in sorted(constituencies_dict.keys()):
        const = constituencies_dict[c_key]
        json_constituencies.append({
            'id': const['id'],
            'countyId': const['countyId'],
            'name': const['name'],
            'code': const['code'],
            'registeredVoters': const['registeredVoters'],
            'wardsCount': len(const['wardsSet'])
        })

    json_wards = []
    for w_key in sorted(wards_dict.keys()):
        w = wards_dict[w_key]
        json_wards.append({
            'id': w['id'],
            'constituencyId': w['constituencyId'],
            'countyId': w['countyId'],
            'name': w['name'],
            'code': w['code'],
            'registeredVoters': w['registeredVoters'],
            'pollingStationsCount': w['pollingStationsCount']
        })

    json_polling_stations = []
    for ps in polling_stations_list:
        json_polling_stations.append({
            'id': ps['id'],
            'wardId': ps['wardId'],
            'constituencyId': ps['constituencyId'],
            'countyId': ps['countyId'],
            'name': ps['name'],
            'code': ps['code'],
            'registeredVoters': ps['registeredVoters']
        })

    geography_json = {
        'counties': json_counties,
        'constituencies': json_constituencies,
        'wards': json_wards,
        'pollingStations': json_polling_stations
    }

    print(f"Writing updated geography dataset to {json_path}...")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(geography_json, f, indent=2)

    # Populate SQLite Database
    print(f"Updating SQLite database at {sqlite_path}...")
    conn = sqlite3.connect(sqlite_path)
    cursor = conn.cursor()

    # Clear existing geography tables
    cursor.execute("DELETE FROM polling_stations;")
    cursor.execute("DELETE FROM wards;")
    cursor.execute("DELETE FROM constituencies;")
    cursor.execute("DELETE FROM counties;")

    # Insert Counties
    for c in json_counties:
        cursor.execute(
            "INSERT INTO counties (id, code, name, registered_voters) VALUES (?, ?, ?, ?)",
            (c['id'], c['code'], c['name'], c['registeredVoters'])
        )

    # Insert Constituencies
    for const in json_constituencies:
        cursor.execute(
            "INSERT INTO constituencies (id, county_id, code, name, registered_voters) VALUES (?, ?, ?, ?, ?)",
            (const['id'], const['countyId'], const['code'], const['name'], const['registeredVoters'])
        )

    # Insert Wards
    for w in json_wards:
        cursor.execute(
            "INSERT INTO wards (id, constituency_id, county_id, code, name, registered_voters) VALUES (?, ?, ?, ?, ?, ?)",
            (w['id'], w['constituencyId'], w['countyId'], w['code'], w['name'], w['registeredVoters'])
        )

    # Insert Polling Stations
    for ps in json_polling_stations:
        cursor.execute(
            "INSERT INTO polling_stations (id, ward_id, constituency_id, county_id, code, name, registered_voters) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (ps['id'], ps['wardId'], ps['constituencyId'], ps['countyId'], ps['code'], ps['name'], ps['registeredVoters'])
        )

    conn.commit()
    conn.close()
    print("Database build completed successfully!")

if __name__ == '__main__':
    build_full_database()
