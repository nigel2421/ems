import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { handleTeamRequest } from '../../server/team-routes.mjs';
import { nextTeamRole, resolveTeamAssignment } from '../utils/teamHierarchy.js';

const geography={counties:[{id:'C1',name:'Nairobi'},{id:'C2',name:'Mombasa'}],constituencies:[{id:'K1',name:'Westlands',countyId:'C1'},{id:'K2',name:'Nyali',countyId:'C2'}],wards:[{id:'W1',name:'Parklands',constituencyId:'K1'},{id:'W2',name:'Nyali Ward',constituencyId:'K2'}],pollingStations:[{id:'P1',name:'Primary',wardId:'W1'},{id:'P2',name:'Secondary',wardId:'W2'}]};
const president={id:'root',name:'Campaign A',role:'Presidential',assignedEntity:'GLOBAL',status:'Active'};
const mp={id:'mp',name:'MP A',role:'MP',assignedEntity:'K1',status:'Active'};
const governor={id:'gov',name:'Governor A',role:'Governor',assignedEntity:'C1',status:'Active'};

test('aspirants start at their level; coordinators move down exactly one level',()=>{
 assert.equal(nextTeamRole(president,geography),'National Coordinator');assert.equal(nextTeamRole(mp,geography),'Constituency Coordinator');assert.equal(nextTeamRole(governor,geography),'County Coordinator');
 assert.equal(nextTeamRole({role:'Ward Coordinator'},geography),'Agent');assert.equal(nextTeamRole({role:'Agent'},geography),null);
 assert.throws(()=>resolveTeamAssignment(mp,'County Coordinator','C1',geography));
 assert.throws(()=>resolveTeamAssignment(mp,'Constituency Coordinator','K2',geography));
});

test('campaign API enforces ancestry, scope and reporting',async t=>{
 const directory=path.resolve('.data',`team-test-${Date.now()}`);fs.mkdirSync(directory,{recursive:true});
 const prior=process.env.USERS_FILE;process.env.USERS_FILE=path.join(directory,'users.json');
 const seed=[president,mp,governor,{...president,id:'other',name:'Campaign B'}];fs.writeFileSync(process.env.USERS_FILE,JSON.stringify(seed));
 const request=async(actor,method,route,body)=>{
  const req=Readable.from(body ? [JSON.stringify(body)] : []);req.method=method;
  let status,payload;const res={writeHead(code){status=code;},end(value){payload=JSON.parse(value);}};
  await handleTeamRequest(req,res,{session:actor ? {uid:actor,realm:'user'} : null,url:new URL(`http://test/api/team${route}`),geography,getDb:()=>({}),audit:()=>{}});return{status,payload};
 };
 let counter=0;const create=(actor,role,assignmentId)=>request(actor,'POST','/members',{role,assignmentId,name:`Person ${++counter}`,phone:`071200${String(counter).padStart(4,'0')}`,password:'Secure!234'});
 try {
  const national=await create('root','National Coordinator','GLOBAL');assert.equal(national.status,201);
  const county=await create(national.payload.user.id,'County Coordinator','C1');assert.equal(county.status,201);
  const constituency=await create(county.payload.user.id,'Constituency Coordinator','K1');assert.equal(constituency.status,201);
  const ward=await create(constituency.payload.user.id,'Ward Coordinator','W1');assert.equal(ward.status,201);
  const agent=await create(ward.payload.user.id,'Agent','P1');assert.equal(agent.status,201);
  assert.equal(agent.payload.user.campaignId,'root');assert.equal(agent.payload.user.parentId,ward.payload.user.id);assert.equal(agent.payload.user.passwordHash,undefined);
  await t.test('cannot skip levels or cross counties',async()=>{assert.equal((await create(county.payload.user.id,'Agent','P1')).status,403);assert.equal((await create(county.payload.user.id,'Constituency Coordinator','K2')).status,403);assert.equal((await create(agent.payload.user.id,'Agent','P1')).status,403);});
  await t.test('cannot read or mutate another campaign',async()=>{const other=await request('other','GET','');assert.equal(other.payload.members.length,0);assert.equal((await request('other','PATCH',`/members/${agent.payload.user.id}`,{status:'Suspended'})).status,403);assert.equal((await request(county.payload.user.id,'PATCH','/members/root',{status:'Suspended'})).status,403);});
  await t.test('agent reports roll up and cannot be self approved',async()=>{const report=await request(agent.payload.user.id,'POST','/reports',{title:'Station ready',notes:'All materials received',category:'Readiness',severity:'Low',campaignId:'other'});assert.equal(report.status,201);const feed=await request('root','GET','');assert.equal(feed.payload.reports.length,1);assert.equal(feed.payload.reports[0].campaignId,'root');assert.equal((await request('other','GET',`/reports/${feed.payload.reports[0].id}`)).status,404);assert.equal((await request(agent.payload.user.id,'PATCH',`/reports/${feed.payload.reports[0].id}`,{status:'Resolved'})).status,403);assert.equal((await request(ward.payload.user.id,'PATCH',`/reports/${feed.payload.reports[0].id}`,{status:'Resolved'})).status,200);});
  await t.test('suspending a parent blocks every descendant',async()=>{assert.equal((await request('root','PATCH',`/members/${county.payload.user.id}`,{status:'Suspended'})).status,200);assert.equal((await request(agent.payload.user.id,'GET','')).status,403);assert.equal((await request('root','PATCH',`/members/${county.payload.user.id}`,{status:'Active'})).status,200);assert.equal((await request(agent.payload.user.id,'GET','')).status,200);});
  await t.test('report figures and evidence are validated',async()=>{const body={title:'Turnout',notes:'Count',category:'Turnout',severity:'Low',metrics:{registeredVoters:10,votesCast:11}};assert.equal((await request(agent.payload.user.id,'POST','/reports',body)).status,400);assert.equal((await request(agent.payload.user.id,'POST','/reports',{...body,metrics:{},evidence:'data:text/html;base64,abc'})).status,400);});
  await t.test('MP and governor creation remains within profile',async()=>{assert.equal((await create('mp','Constituency Coordinator','K1')).status,201);assert.equal((await create('gov','County Coordinator','C1')).status,201);});
  await t.test('unauthenticated access is denied',async()=>{assert.equal((await request(null,'GET','')).status,401);});
 }finally{if(prior===undefined)delete process.env.USERS_FILE;else process.env.USERS_FILE=prior;for(const file of fs.readdirSync(directory))fs.unlinkSync(path.join(directory,file));fs.rmdirSync(directory);}
});
