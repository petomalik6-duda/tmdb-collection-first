import http from 'node:http';
import {pathToFileURL} from 'node:url';
export const manifest={id:'sk.tmdb.collectionfirst',version:'1.0.0',name:'TMDB Collection First',description:'Movie franchise first, then TMDB recommendations.',resources:['catalog'],types:['movie'],idPrefixes:['tt','tmdb:'],catalogs:[{type:'movie',id:'similar',name:'More Like This',extra:[{name:'similar',isRequired:true}],idPrefixes:['tt','tmdb:'],showInHome:false}]};
const language=process.env.TMDB_LANGUAGE||'sk-SK';
async function api(path,params={}){
 const u=new URL('https://api.themoviedb.org/3'+path);u.searchParams.set('language',language);
 for(const [k,v] of Object.entries(params))u.searchParams.set(k,v);
 const token=process.env.TMDB_TOKEN,key=process.env.TMDB_API_KEY;
 if(!token&&!key)throw Error('TMDB credentials missing');
 if(!token)u.searchParams.set('api_key',key);
 const r=await fetch(u,{headers:token?{Authorization:`Bearer ${token}`}:{},signal:AbortSignal.timeout(8000)});
 if(!r.ok)throw Error(`TMDB HTTP ${r.status}`);return r.json();
}
export async function similar(id,get=api){
 let mid;
 if(/^tt\d+$/.test(id)){mid=(await get('/find/'+id,{external_source:'imdb_id'})).movie_results?.[0]?.id;}
 else if(/^tmdb:\d+$/.test(id))mid=Number(id.slice(5));
 if(!mid)return [];
 const movie=await get('/movie/'+mid,{append_to_response:'recommendations'});
 let parts=[];if(movie.belongs_to_collection?.id){try{parts=(await get('/collection/'+movie.belongs_to_collection.id)).parts||[];}catch(e){console.error('Collection lookup failed:',e.message);}}
 parts.sort((a,b)=>(a.release_date||'9999').localeCompare(b.release_date||'9999'));
 const seen=new Set([mid]);const result=[];
 for(const item of [...parts,...(movie.recommendations?.results||[])]){
 if(!item.id||seen.has(item.id))continue;seen.add(item.id);
 const meta={id:`tmdb:${item.id}`,type:'movie',name:item.title||item.original_title||String(item.id)};
 if(item.poster_path)meta.poster='https://image.tmdb.org/t/p/w500'+item.poster_path;
 if(item.backdrop_path)meta.background='https://image.tmdb.org/t/p/w1280'+item.backdrop_path;
 if(item.release_date)meta.releaseInfo=item.release_date.slice(0,4);
 if(item.overview)meta.description=item.overview;result.push(meta);
 }
 return result.slice(0,40);
}
const cache=new Map();
export function server(){return http.createServer(async(req,res)=>{
 res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');res.setHeader('Content-Type','application/json');
 const send=(status,data)=>{res.writeHead(status);res.end(JSON.stringify(data));};
 if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
 if(req.method!=='GET')return send(405,{error:'Method not allowed'});
 try{const p=new URL(req.url,'http://localhost').pathname;
 if(p==='/manifest.json')return send(200,manifest);
 if(p==='/'||p==='/health')return send(200,{ok:true,configured:!!(process.env.TMDB_TOKEN||process.env.TMDB_API_KEY)});
 const m=p.match(/^\/catalog\/movie\/similar\/similar=([^/]+)\.json$/);
 if(!m)return send(404,{error:'Not found'});
 const id=decodeURIComponent(m[1]);const existing=cache.get(id);
 if(existing&&existing.until>Date.now())return send(200,{metas:existing.data});
 const metas=await similar(id);if(metas.length){if(cache.size>=500)cache.delete(cache.keys().next().value);cache.set(id,{data:metas,until:Date.now()+3600000});}
 return send(200,{metas});
 }catch(e){console.error(e.message);return send(200,{metas:[]});}
 });}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)server().listen(Number(process.env.PORT||3000),'0.0.0.0');
