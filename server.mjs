import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
mkdirSync(path.join(root, 'data'), { recursive: true });
const db = new DatabaseSync(process.env.CV_DB || path.join(root, 'data', 'village.sqlite'));
db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS villages(id INTEGER PRIMARY KEY,name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS areas(id INTEGER PRIMARY KEY,village_id INTEGER REFERENCES villages(id),name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS teams(id INTEGER PRIMARY KEY,village_id INTEGER REFERENCES villages(id),area_id INTEGER REFERENCES areas(id),name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,name TEXT,email TEXT UNIQUE,password TEXT,role TEXT CHECK(role IN ('citizen','manager','admin','staff')),village_id INTEGER REFERENCES villages(id),team_id INTEGER REFERENCES teams(id),coins INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER REFERENCES users(id),expires INTEGER);
CREATE TABLE IF NOT EXISTS complaints(id INTEGER PRIMARY KEY,user_id INTEGER REFERENCES users(id),village_id INTEGER REFERENCES villages(id),area_id INTEGER REFERENCES areas(id),title TEXT,description TEXT,category TEXT,landmark TEXT,latitude REAL,longitude REAL,photo TEXT,status TEXT DEFAULT 'submitted',priority TEXT DEFAULT 'Normal',team_id INTEGER REFERENCES teams(id),proof TEXT,created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS history(id INTEGER PRIMARY KEY,complaint_id INTEGER REFERENCES complaints(id),actor_id INTEGER REFERENCES users(id),status TEXT,note TEXT,photo TEXT,created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS ledger(id INTEGER PRIMARY KEY,user_id INTEGER REFERENCES users(id),complaint_id INTEGER REFERENCES complaints(id),event TEXT,amount INTEGER,created TEXT DEFAULT CURRENT_TIMESTAMP,UNIQUE(complaint_id,event));
CREATE TABLE IF NOT EXISTS notifications(id INTEGER PRIMARY KEY,user_id INTEGER REFERENCES users(id),message TEXT,created TEXT DEFAULT CURRENT_TIMESTAMP);
`);
const all=(sql,...a)=>db.prepare(sql).all(...a), one=(sql,...a)=>db.prepare(sql).get(...a), run=(sql,...a)=>db.prepare(sql).run(...a);
function hash(p,s=randomBytes(16).toString('hex')) {return s+':'+scryptSync(p,s,64).toString('hex');}
function check(p,h) {const [s,k]=h.split(':');return timingSafeEqual(Buffer.from(k,'hex'),Buffer.from(hash(p,s).split(':')[1],'hex'));}
const demo=process.argv.includes('--demo');
if(demo && !one('SELECT id FROM users LIMIT 1')) {
 db.exec(`INSERT INTO villages VALUES(1,'Pinapadu'),(2,'Burripalem'); INSERT INTO areas VALUES(1,1,'School Road'),(2,1,'Market Area'),(3,2,'Main Road'); INSERT INTO teams VALUES(1,1,1,'School Road Sanitation Team'),(2,1,2,'Market Area Sanitation Team'),(3,2,3,'Burripalem Sanitation Team');`);
 for(const [name,email,role,village,team] of [['Resident','resident@demo.local','citizen',1,null],['Village Manager','manager@demo.local','manager',1,null],['Administrator','admin@demo.local','admin',1,null],['Team Member','staff@demo.local','staff',1,1],['Second Resident','other@demo.local','citizen',2,null],['Burripalem Manager','manager2@demo.local','manager',2,null]])
 run('INSERT INTO users(name,email,password,role,village_id,team_id) VALUES(?,?,?,?,?,?)',name,email,hash('VillageDemo!2026'),role,village,team);
}
function fail(message,status=400){throw Object.assign(new Error(message),{status});}
function required(s,name,max=2000){if(typeof s!=='string'||!s.trim()||s.length>max)fail(`${name} is required (maximum ${max} characters).`);return s.trim();}
function picture(s){if(typeof s!=='string'||s.length>2800000||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s))fail('Attach a PNG, JPEG or WebP photograph smaller than 2 MB.');return s;}
function notify(id,msg){run('INSERT INTO notifications(user_id,message) VALUES(?,?)',id,msg);}
function officials(village,msg){for(const u of all("SELECT id FROM users WHERE role='admin' OR (role='manager' AND village_id=?)",village))notify(u.id,msg);}
function credit(c,event,amount){const u=one('SELECT * FROM users WHERE id=?',c.user_id);if(amount>0&&u.role!=='citizen')return;const r=run('INSERT OR IGNORE INTO ledger(user_id,complaint_id,event,amount) VALUES(?,?,?,?)',u.id,c.id,event,amount);if(r.changes){run('UPDATE users SET coins=coins+? WHERE id=?',amount,u.id);notify(u.id,`${amount>0?'+':''}${amount} coins for complaint CV-${String(c.id).padStart(4,'0')}.`);}}
function authorized(u,c){return u.role==='admin'||(u.role==='manager'&&u.village_id===c.village_id)||(u.role==='citizen'&&u.id===c.user_id)||(u.role==='staff'&&u.team_id===c.team_id);}
function manager(u,c){if(!(u.role==='admin'||u.role==='manager'&&u.village_id===c.village_id))fail('You cannot manage this complaint.',403);}
function transaction(fn){db.exec('BEGIN IMMEDIATE');try {const out=fn();db.exec('COMMIT');return out;}catch(e){db.exec('ROLLBACK');throw e;}}
async function body(req){let text='';for await(const chunk of req){text+=chunk;if(text.length>6000000)fail('Request too large.',413);}try{return JSON.parse(text||'{}');}catch{fail('Invalid JSON.');}}
const publicFiles={'/':'index.html','/app.js':'app.js','/redesign.css':'redesign.css','/style.css':'style.css','/assets/green-canopy.jpg':'assets/green-canopy.jpg'};
const server=http.createServer(async(req,res)=>{
 const send=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
 try {
 const url=new URL(req.url,'http://localhost');
 if(!url.pathname.startsWith('/api/')){const file=publicFiles[url.pathname];if(!file)fail('Not found.',404);res.writeHead(200,{'Content-Type':file.endsWith('.jpg')?'image/jpeg':file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'"});res.end(readFileSync(path.join(root,'public',file)));return;}
 if(req.method==='POST'&&req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)fail('Invalid request origin.',403);
 const b=req.method==='POST'?await body(req):{};
 if(url.pathname==='/api/login'&&req.method==='POST') {const u=one('SELECT * FROM users WHERE email=?',String(b.email||'').toLowerCase());if(!u||!check(String(b.password||''),u.password))fail('Email or password is incorrect.',401);const token=randomBytes(32).toString('hex');run('INSERT INTO sessions VALUES(?,?,?)',token,u.id,Date.now()+28800000);res.setHeader('Set-Cookie',`cv_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`);send({ok:true});return;}
 const token=req.headers.cookie?.match(/(?:^|; )cv_session=([a-f0-9]+)/)?.[1];
 const u=one('SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>?',token||'',Date.now());
 if(url.pathname==='/api/session'){send({user:u?{id:u.id,name:u.name,role:u.role,village_id:u.village_id,team_id:u.team_id,...(u.role==='citizen'?{coins:u.coins}:{})}:null,demo});return;}
 if(!u)fail('Please sign in.',401);
 if(url.pathname==='/api/logout'&&req.method==='POST'){run('DELETE FROM sessions WHERE token=?',token);res.setHeader('Set-Cookie','cv_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');send({ok:true});return;}
 if(url.pathname==='/api/data'&&req.method==='GET'){
 const clauses={citizen:['c.user_id=?',u.id],manager:['c.village_id=?',u.village_id],staff:['c.team_id=?',u.team_id],admin:['1=1',null]},[where,id]=clauses[u.role];
 const complaints=all(`SELECT c.*,v.name village,a.name area,t.name team FROM complaints c JOIN villages v ON v.id=c.village_id JOIN areas a ON a.id=c.area_id LEFT JOIN teams t ON t.id=c.team_id WHERE ${where} ORDER BY c.id DESC`,...(id===null?[]:[id])).map(c=>({...c,history:all('SELECT h.*,u.name actor FROM history h JOIN users u ON u.id=h.actor_id WHERE complaint_id=? ORDER BY h.id',c.id)}));
 const teams=all(`SELECT t.*,EXISTS(SELECT 1 FROM complaints c WHERE c.team_id=t.id AND c.status IN ('assigned','in_progress')) busy,(SELECT COUNT(*) FROM complaints c WHERE c.team_id=t.id AND c.status='rework_required') queued FROM teams t ${u.role==='admin'?'':'WHERE t.village_id=?'}`,...(u.role==='admin'?[]:[u.village_id]));
 send({complaints,teams:u.role==='citizen'?[]:teams,villages:all('SELECT * FROM villages'),areas:all('SELECT * FROM areas'),notifications:all('SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 30',u.id),ledger:u.role==='citizen'?all('SELECT * FROM ledger WHERE user_id=? ORDER BY id DESC',u.id):[]});return;
 }
 if(url.pathname==='/api/complaints'&&req.method==='POST'){
 if(u.role!=='citizen')fail('Only normal users may submit complaints.',403);
 const title=required(b.title,'Title',140),description=required(b.description,'Description'),landmark=required(b.landmark,'Landmark',250),category=required(b.category,'Category',80),photo=picture(b.photo);
 const area=one('SELECT * FROM areas WHERE id=? AND village_id=?',Number(b.area_id),Number(b.village_id));if(!area)fail('Select a supported village and area.');
 if(b.latitude===''||b.longitude===''||!Number.isFinite(Number(b.latitude))||!Number.isFinite(Number(b.longitude))||Math.abs(Number(b.latitude))>90||Math.abs(Number(b.longitude))>180)fail('Provide valid location coordinates.');
 transaction(()=>{const id=Number(run('INSERT INTO complaints(user_id,village_id,area_id,title,description,category,landmark,latitude,longitude,photo) VALUES(?,?,?,?,?,?,?,?,?,?)',u.id,area.village_id,area.id,title,description,category,landmark,Number(b.latitude),Number(b.longitude),photo).lastInsertRowid);run('INSERT INTO history(complaint_id,actor_id,status,note,photo) VALUES(?,?,?,?,?)',id,u.id,'submitted','Complaint submitted.',photo);officials(area.village_id,`New complaint CV-${String(id).padStart(4,'0')}: ${title}`);notify(u.id,'Your complaint was submitted successfully.');});send({ok:true},201);return;
 }
 const match=url.pathname.match(/^\/api\/complaints\/(\d+)\/action$/);
 if(match&&req.method==='POST'){
 transaction(()=>{
 const c=one('SELECT * FROM complaints WHERE id=?',Number(match[1]));if(!c||!authorized(u,c))fail('Complaint not found.',404);
 if(c.status!==b.expectedStatus)fail('This complaint changed. Refresh and try again.',409);
 let next=c.status,note=String(b.note||'').trim().slice(0,2000),proof=null,team=c.team_id,priority=c.priority;
 const action=b.action;
 if(['verify','assign','resolve','reject','rework'].includes(action))manager(u,c);
 if(action==='verify'){
 if(!['submitted','resubmitted'].includes(c.status))fail('This complaint cannot be verified at this stage.');
 next='verified';credit(c,'verified',10);
 if(one("SELECT id FROM ledger WHERE complaint_id=? AND event='reversal'",c.id))credit(c,'restored',10);
 }else if(action==='assign'){
 if(c.status!=='verified')fail('Verify the complaint before assigning work.');team=Number(b.team_id);
 if(!one('SELECT id FROM teams WHERE id=? AND village_id=? AND area_id=?',team,c.village_id,c.area_id))fail('Select a team serving this area.');
 if(one("SELECT id FROM complaints WHERE team_id=? AND status IN ('assigned','in_progress')",team))fail('This team is busy. Choose an available team.');next='assigned';
 }else if(action==='start'||action==='complete'||action==='no_issue'){
 if(u.role!=='staff'||u.team_id!==team)fail('Only assigned team members may submit work updates.',403);
 if(action==='start') {if(!['assigned','rework_required'].includes(c.status))fail('This assignment cannot be started.');if(one("SELECT id FROM complaints WHERE team_id=? AND id<>? AND status IN ('assigned','in_progress')",team,c.id))fail('Finish the current assignment before starting queued rework.');next='in_progress';}
 else {if(c.status!=='in_progress')fail('Start work before submitting evidence.');proof=picture(b.proof);next=action==='complete'?'awaiting_verification':'no_issue_reported';if(action==='no_issue')note=required(note,'Reason');}
 }else if(action==='resolve'){if(c.status!=='awaiting_verification')fail('Completion proof must be submitted first.');next='resolved';credit(c,'resolved',10);}
 else if(action==='rework'){if(!['awaiting_verification','no_issue_reported'].includes(c.status))fail('There is no work evidence to review.');note=required(note,'Reason');next='rework_required';}
 else if(action==='reject'){if(!['submitted','resubmitted','no_issue_reported'].includes(c.status))fail('Rejection is unavailable at this stage.');note=required(note,'Rejection reason');next='rejected';if(one("SELECT id FROM ledger WHERE complaint_id=? AND event='verified'",c.id))credit(c,'reversal',-10);}
 else fail('Unsupported action.');
 if(b.priority&&['admin','manager'].includes(u.role)){if(!['Low','Normal','High'].includes(b.priority))fail('Invalid priority.');priority=b.priority;}
 run('UPDATE complaints SET status=?,team_id=?,proof=COALESCE(?,proof),priority=? WHERE id=?',next,team,proof,priority,c.id);
 run('INSERT INTO history(complaint_id,actor_id,status,note,photo) VALUES(?,?,?,?,?)',c.id,u.id,next,note,proof);
 notify(c.user_id,`CV-${String(c.id).padStart(4,'0')}: ${next.replaceAll('_',' ')}.`);
 officials(c.village_id,`CV-${String(c.id).padStart(4,'0')} updated to ${next.replaceAll('_',' ')}.`);
 if(team)for(const member of all("SELECT id FROM users WHERE team_id=? AND role='staff'",team))notify(member.id,`CV-${String(c.id).padStart(4,'0')}: ${next.replaceAll('_',' ')}.`);
 });send({ok:true});return;
 }
 fail('Endpoint not found.',404);
 }catch(e){if(!e.status)console.error(e);send({error:e.status?e.message:'An unexpected server error occurred.'},e.status||500);}
});
server.listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log(`CleanVillage: http://127.0.0.1:${process.env.PORT||4173}${demo?' — local development demo':''}`));

