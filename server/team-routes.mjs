import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { loadUsers, saveUsers, findUserByEmail, findUserByPhone, getUsersFilePath } from './users.store.js';
import { hashPassword } from './auth.js';
import { checkPasswordComplexity } from '../src/utils/passwordPolicy.js';
import { campaignRoot, isAspirant, isSystemAdmin, isStationAgent, isDescendant, isTeamAccountActive, nextTeamRole, teamScope, isLocationInScope, resolveTeamAssignment, parentIdOf } from '../src/utils/teamHierarchy.js';

const publicUser = user => {
  if (!user) return null;
  const { passwordHash, password, ...safe } = user;
  return safe;
};
const fail = (status, message) => Object.assign(new Error(message), { status });
const readBody = req => new Promise((resolve, reject) => {
  let body = '', size = 0;
  req.on('data', chunk => { size += chunk.length; if (size > 8 * 1024 * 1024) { reject(fail(413, 'The report is too large. Use an image smaller than 5 MB.')); return; } body += chunk; });
  req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { reject(fail(400, 'Invalid request body.')); } });
  req.on('error', reject);
});
const reportsFile = () => path.join(path.dirname(getUsersFilePath()), 'campaign-reports.json');
const readReports = () => { try { return JSON.parse(fs.readFileSync(reportsFile(), 'utf8')); } catch (error) { if (error.code === 'ENOENT') return []; throw error; } };
const writeReports = reports => {
  const file = reportsFile();
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.writeFileSync(`${file}.tmp`, JSON.stringify(reports));
  fs.renameSync(`${file}.tmp`, file);
};
const allowedCategories = ['Daily update', 'Readiness', 'Check-in', 'Turnout', 'Results', 'Incident', 'Logistics'];
const canonicalLocation = (actor, geography) => {
  const scope = teamScope(actor, geography);
  return {countyId:scope.county?.id || null,county:scope.county?.name || null,constituencyId:scope.constituency?.id || null,constituency:scope.constituency?.name || null,wardId:scope.ward?.id || null,ward:scope.ward?.name || null,pollingStationId:scope.station?.id || null};
};

export const handleTeamRequest = async (req, res, context) => {
  const send = (status, value) => { res.writeHead(status, {'Content-Type':'application/json','Cache-Control':'no-store'}); res.end(JSON.stringify(value)); };
  try {
    const body = req.method === 'GET' ? {} : await readBody(req);
    const users = loadUsers();
    const actor = users.find(user => user.id === context.session?.uid);
    if (!actor || !context.session) throw fail(401, 'Sign in to access your campaign workspace.');
    if (!isTeamAccountActive(actor, users)) throw fail(403, 'This account or its reporting line has been suspended.');
    const admin = isSystemAdmin(actor) && context.session.realm === 'admin';
    const selectedRoot = context.url.searchParams.get('aspirantId');
    const root = admin ? users.find(user => user.id === selectedRoot && isAspirant(user)) : campaignRoot(actor, users);
    if (!root) {
      if (admin && req.method === 'GET') { send(200,{aspirants:users.filter(isAspirant).map(publicUser),members:[],reports:[]}); return; }
      throw fail(403, 'Your account must be linked to an aspirant before using this workspace.');
    }
    const manager = admin ? root : actor;
    const scope = teamScope(manager, context.geography);
    if (!scope.isConfigured || scope.failClosed) throw fail(403, scope.error || 'Your electoral assignment is incomplete.');
    const rootScope=teamScope(root,context.geography);
    if(!isLocationInScope(rootScope,scope)) throw fail(403,'Your assignment exceeds the aspirant’s area.');
    const visible = users.filter(user => user.id === manager.id || (isDescendant(manager,user,users) && isLocationInScope(scope,teamScope(user,context.geography))));
    const visibleIds = new Set(visible.map(user => user.id));
    const canManage = target => target && visibleIds.has(target.id) && isDescendant(manager,target,users);
    const reportVisible = report => report.campaignId === root.id && visibleIds.has(report.authorId);
    const reportPath = /\/reports(?:\/([^/]+))?$/.exec(context.url.pathname);
    const memberPath = /\/members(?:\/([^/]+))?$/.exec(context.url.pathname);

    if (req.method === 'GET' && !reportPath && !memberPath) {
      const wards = new Map(context.geography.wards.map(item=>[item.id,item]));
      const constituencies = new Map(context.geography.constituencies.map(item=>[item.id,item]));
      const counties = new Map(context.geography.counties.map(item=>[item.id,item]));
      const stations = context.geography.pollingStations.filter(station => {
        if (scope.station) return scope.station.id === station.id;
        const ward = wards.get(station.wardId);
        const constituency = constituencies.get(ward?.constituencyId);
        const county = counties.get(constituency?.countyId);
        return isLocationInScope(scope,{county,constituency,ward,station});
      });
      const stationIds = new Set(stations.map(station=>station.id));
      const reports = readReports().filter(reportVisible).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
      const agents = visible.filter(isStationAgent);
      const coveredStations = new Set(agents.filter(user=>isTeamAccountActive(user,users)).flatMap(user=>user.assignedStations || [user.pollingStationId || user.assignedEntity]).filter(id=>stationIds.has(id)));
      const tallies = (context.getDb().tallyResults || []).filter(tally => (tally.campaignId === root.id || visibleIds.has(tally.agentId || tally.submittedById || tally.userId)) && stationIds.has(tally.pollingStationId || tally.stationId));
      send(200, {self:publicUser(actor),aspirant:publicUser(root),supervisor:publicUser(users.find(user=>user.id===parentIdOf(actor))),nextRole:nextTeamRole(manager,context.geography),scope:{level:scope.level,county:scope.county?.name,constituency:scope.constituency?.name,ward:scope.ward?.name,station:scope.station?.name},members:visible.filter(user=>user.id!==manager.id).map(user=>({...publicUser(user),effectiveActive:isTeamAccountActive(user,users)})),reports:reports.slice(0,200).map(({evidence,...report})=>({...report,hasEvidence:Boolean(evidence)})),reportCount:reports.length,summary:{stations:stations.length,coveredStations:coveredStations.size,team:visible.length-1,directReports:visible.filter(user=>parentIdOf(user)===manager.id).length,active:visible.filter(user=>user.id!==manager.id && isTeamAccountActive(user,users)).length,pendingReports:reports.filter(report=>report.status!=='Resolved').length,urgentReports:reports.filter(report=>['High','Critical'].includes(report.severity)&&report.status!=='Resolved').length,submittedTallies:tallies.length,resultsReports:reports.filter(report=>report.category==='Results').length,reportingStations:new Set(reports.map(report=>report.location?.pollingStationId).filter(Boolean)).size}}); return;
    }
    if (req.method === 'GET' && reportPath?.[1]) {
      const report=readReports().find(item=>item.id===decodeURIComponent(reportPath[1]) && reportVisible(item));
      if(!report) throw fail(404,'Report not found in your reporting line.');
      send(200,{report}); return;
    }
    if (req.method === 'POST' && memberPath && !memberPath[1]) {
      const role = nextTeamRole(manager,context.geography);
      if (!role || body.role !== role) throw fail(403,'You can create only the next level in your reporting line.');
      const name = String(body.name || '').trim(), phone = String(body.phone || '').replace(/[\s()-]/g,''), email = String(body.email || '').trim().toLowerCase() || `${phone.replace(/\D/g,'')}@team.ems.ke`;
      if (name.length < 2 || name.length > 120 || !/^(?:\+?254|0)[17]\d{8}$/.test(phone)) throw fail(400,'Enter a full name and valid Kenyan phone number.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail(400,'Enter a valid email address.');
      const passwordCheck = checkPasswordComplexity(body.password);
      if (!passwordCheck.isValid) throw fail(400,passwordCheck.errors.join(' · '));
      if (findUserByEmail(email) || users.some(user=>String(user.phone||'').replace(/\D/g,'').slice(-9)===phone.replace(/\D/g,'').slice(-9))) throw fail(409,'An account with this email or phone already exists.');
      let assignment;
      try { assignment = resolveTeamAssignment(manager,role,body.assignmentId,context.geography); } catch (error) { throw fail(403,error.message); }
      const member = {id:`USR-${crypto.randomUUID()}`,name,email,phone,role,...assignment,campaignId:root.id,aspirantId:root.id,candidateId:root.id,parentId:manager.id,supervisorId:manager.id,supervisor:manager.name,creatorId:actor.id,contestType:root.contestType || root.contest || root.role,status:'Active',isSuspended:false,twoFactorEnabled:false,passwordHash:hashPassword(body.password),createdAt:new Date().toISOString()};
      saveUsers([member,...users]);
      context.audit({userId:actor.id,userName:actor.name,role:actor.role,action:'TEAM_MEMBER_CREATED',details:`Created ${role} ${name} for campaign ${root.id} under ${manager.id}`});
      send(201,{success:true,user:publicUser(member)}); return;
    }
    if (req.method === 'PATCH' && memberPath?.[1]) {
      const target = users.find(user=>user.id===decodeURIComponent(memberPath[1]));
      if (!canManage(target)) throw fail(403,'You can manage only people below you in this campaign.');
      if (!['Active','Suspended'].includes(body.status)) throw fail(400,'Choose Active or Suspended.');
      target.status=body.status; target.isSuspended=body.status==='Suspended';
      saveUsers(users);
      context.audit({userId:actor.id,userName:actor.name,role:actor.role,action:'TEAM_MEMBER_STATUS',details:`Set ${target.id} to ${body.status} in campaign ${root.id}`});
      send(200,{success:true}); return;
    }
    if (req.method === 'POST' && reportPath && !reportPath[1]) {
      const title=String(body.title || '').trim(), notes=String(body.notes || '').trim();
      if (!allowedCategories.includes(body.category) || !title || title.length>180 || !notes || notes.length>12000 || !['Low','Medium','High','Critical'].includes(body.severity)) throw fail(400,'Enter a report title, notes, category, and severity.');
      const metrics={};
      for(const key of ['registeredVoters','votesCast','validVotes','rejectedVotes']) {
        if(body.metrics?.[key]!==undefined && body.metrics[key]!=='') {
          const value=Number(body.metrics[key]);
          if(!Number.isSafeInteger(value) || value<0) throw fail(400,'Report figures must be non-negative whole numbers.');
          metrics[key]=value;
        }
      }
      if(metrics.votesCast!==undefined && metrics.registeredVoters!==undefined && metrics.votesCast>metrics.registeredVoters) throw fail(400,'Votes cast cannot exceed registered voters.');
      if(metrics.validVotes!==undefined && metrics.rejectedVotes!==undefined && metrics.votesCast!==undefined && metrics.validVotes+metrics.rejectedVotes!==metrics.votesCast) throw fail(400,'Valid and rejected votes must add up to votes cast.');
      let evidence=null;
      if (body.evidence) {
        if (typeof body.evidence!=='string' || body.evidence.length>7*1024*1024 || !/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=\r\n]+$/.test(body.evidence)) throw fail(400,'Evidence must be a PNG, JPEG or WebP image smaller than 5 MB.');
        evidence=body.evidence;
      }
      const report={id:crypto.randomUUID(),campaignId:root.id,authorId:actor.id,authorName:actor.name,authorRole:actor.role,parentId:parentIdOf(actor)||root.id,location:canonicalLocation(actor,context.geography),category:body.category,title,notes,severity:body.severity,metrics,evidence,status:'Submitted',createdAt:new Date().toISOString()};
      writeReports([report,...readReports()]);
      context.audit({userId:actor.id,userName:actor.name,role:actor.role,action:'CAMPAIGN_REPORT_SUBMITTED',details:`Submitted ${report.category} ${report.id} to campaign ${root.id}`});
      send(201,{success:true,report}); return;
    }
    if (req.method === 'PATCH' && reportPath?.[1]) {
      const reports=readReports(), report=reports.find(item=>item.id===decodeURIComponent(reportPath[1]));
      const author=users.find(user=>user.id===report?.authorId);
      if (!report || !reportVisible(report) || !canManage(author)) throw fail(403,'You can review only reports from your subordinate team.');
      if (!['In review','Resolved'].includes(body.status)) throw fail(400,'Choose In review or Resolved.');
      report.status=body.status; report.reviewNote=String(body.reviewNote||'').slice(0,2000); report.reviewedBy=actor.name; report.reviewedAt=new Date().toISOString(); writeReports(reports);
      context.audit({userId:actor.id,userName:actor.name,role:actor.role,action:'CAMPAIGN_REPORT_REVIEWED',details:`${report.id}: ${body.status}`});
      send(200,{success:true}); return;
    }
    throw fail(405,'This operation is not available.');
  } catch (error) { send(error.status || 500,{success:false,error:error.status ? error.message : 'Unable to process the campaign request. Please try again.'}); }
};
