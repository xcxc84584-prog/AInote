// v3.8.9.4 internal reporter extension point. Never accept arbitrary public /log writes.
// Example: await report_webserver_powershell_log(sql,{source:'worker',level:'info',event_code:'SYNC',message:'Completed'});
export async function report_webserver_powershell_log(sql,{source='worker',level='info',event_code='EVENT',message=''}={}){
 const src=String(source).slice(0,64),lvl=String(level).slice(0,16),code=String(event_code).slice(0,64),msg=String(message).slice(0,2000);
 await sql`INSERT INTO bv_console_logs(source,level,event_code,message) VALUES(${src},${lvl},${code},${msg})`;
}
