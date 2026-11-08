#!/usr/bin/env python3
"""
Kuratech EMS — Interactive Live & Staging Smoke Runner
Usage:
    python tests/e2e_selenium/run_smoke.py
    python tests/e2e_selenium/run_smoke.py --headed
    python tests/e2e_selenium/run_smoke.py --env=local
"""

import sys
import os
import argparse
from pathlib import Path

# Add parent directory to path so pages and conftest are importable
current_dir = Path(__file__).parent.resolve()
sys.path.insert(0, str(current_dir))

from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from pages import LoginPage, AdminConsolePage, CampaignAppPage
from dotenv import load_dotenv

env_file = current_dir / '.env.test'
if env_file.exists():
    load_dotenv(dotenv_path=env_file)
else:
    load_dotenv()


def create_driver(headed=False):
    options = ChromeOptions()
    if not headed:
        options.add_argument("--headless=new")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--ignore-certificate-errors")
    options.add_argument("--allow-insecure-localhost")

    try:
        service = ChromeService(ChromeDriverManager().install())
        drv = webdriver.Chrome(service=service, options=options)
    except Exception:
        drv = webdriver.Chrome(options=options)

    drv.set_page_load_timeout(30)
    drv.implicitly_wait(2)
    return drv


def run_live_smoke(env="live", headed=False):
    print("=" * 65)
    print(f"🚀 Kuratech EMS — Automated Smoke Verification [Target: {env.upper()}]")
    print("=" * 65)

    if env == "local":
        user_url = os.getenv("EMS_LOCAL_USER_URL", "http://localhost:5173")
        admin_url = os.getenv("EMS_LOCAL_ADMIN_URL", "http://ops-konsole.localhost:5173")
    else:
        user_url = os.getenv("EMS_USER_BASE_URL", "https://kuratech.site")
        admin_url = os.getenv("EMS_ADMIN_BASE_URL", "https://ops-konsole.kuratech.site")

    admin_email = os.getenv("TEST_ADMIN_EMAIL", "admin.super@ems.go.ke")
    admin_password = os.getenv("TEST_ADMIN_PASSWORD", "dev-local-only-password")

    governor_email = os.getenv("TEST_GOVERNOR_EMAIL", "governor.nairobi@ems.go.ke")
    governor_password = os.getenv("TEST_GOVERNOR_PASSWORD", "dev-local-only-password")

    driver = create_driver(headed=headed)

    try:
        # -------------------------------------------------------------
        # TC-A01: Super Admin login on dedicated operations console
        # -------------------------------------------------------------
        print("\n[1/3] Testing TC-A01: Super Admin login on Operations Console...")
        print(f"      Navigating to: {admin_url}")
        login_page = LoginPage(driver)
        admin_page = AdminConsolePage(driver)

        login_page.navigate(admin_url)
        assert login_page.is_login_form_displayed(), "Login form not visible on admin console"

        login_page.login(admin_email, admin_password)
        assert admin_page.is_console_loaded(), "Operations Console shell failed to load"
        print(f"      ✅ PASS: Authenticated as Super Admin on {admin_url}")

        # -------------------------------------------------------------
        # TC-A02: Admin credentials denied on main user domain
        # -------------------------------------------------------------
        print("\n[2/3] Testing TC-A02: Cross-realm security barrier on User Domain...")
        print(f"      Navigating to: {user_url}")
        login_page.navigate(user_url)
        assert login_page.is_login_form_displayed(), "Login form not visible on user domain"

        login_page.login(admin_email, admin_password)
        assert login_page.has_error(), "Security barrier failed: Admin was not denied on user domain"
        print(f"      ✅ PASS: Admin credentials correctly DENIED on {user_url}")

        # -------------------------------------------------------------
        # TC-A03: Campaign Governor login on main user domain
        # -------------------------------------------------------------
        print("\n[3/3] Testing TC-A03: Campaign Governor login on User Domain...")
        app_page = CampaignAppPage(driver)
        login_page.login(governor_email, governor_password)

        assert app_page.is_app_loaded(), "Campaign dashboard failed to load for Governor"
        role = app_page.get_user_role()
        assert "Governor" in role, f"Unexpected role: {role}"
        print(f"      ✅ PASS: Governor authenticated successfully with role '{role}'")

        print("\n" + "=" * 65)
        print("🎉 ALL LIVE SMOKE CHECKS PASSED WITH ZERO DISRUPTION TO OPERATIONS!")
        print("=" * 65)

    except Exception as e:
        print(f"\n❌ FAIL: {e}")
        raise e
    finally:
        driver.quit()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Kuratech EMS Smoke Runner")
    parser.add_argument("--env", default="live", choices=["live", "staging", "local"])
    parser.add_argument("--headed", action="store_true", default=False)
    args = parser.parse_args()

    run_live_smoke(env=args.env, headed=args.headed)
