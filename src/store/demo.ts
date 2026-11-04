'use client';
import { create } from 'zustand';
import { seed } from '@/domain/seed';
import { transition } from '@/domain/workflow';
import type { Action, DemoData, Role, User } from '@/domain/types';
const KEY='dicom-demo-v1';
export const persona=(data:DemoData,role:Role,entityId?:string):User=>role==='admin'?{id:'admin-1',role,name:'DICOM Admin',timezone:'Asia/Kolkata',entityId:'admin-1'}:role==='centre'?(()=>{const c=data.centres.find(c=>c.id===entityId)??data.centres[0];return{id:c.id,role,name:c.name,timezone:c.timezone,entityId:c.id};})():(()=>{const d=data.doctors.find(d=>d.id===entityId)??data.doctors[0];return{id:d.id,role,name:d.name,timezone:'Asia/Kolkata',entityId:d.id};})();
export function decodeStored(raw:string):{data:DemoData;user:User|null}{const saved=JSON.parse(raw);if(saved.data?.schemaVersion!==1||!Array.isArray(saved.data.cases)||!Array.isArray(saved.data.centres)||!Array.isArray(saved.data.training)||!saved.data.settings)throw new Error('Invalid saved demo');return{data:saved.data,user:saved.user?persona(saved.data,saved.user.role,saved.user.entityId):null};}
interface Store { data:DemoData|null; user:User|null; ready:boolean; storageError:string; toast:string; init:()=>void; switchRole:(role:Role,id?:string)=>void; signOut:()=>void; act:(action:Action)=>boolean; reset:()=>void; message:(text:string)=>void }
function persist(data:DemoData,user:User|null){try{localStorage.setItem(KEY,JSON.stringify({data,user}));return '';}catch{return 'Browser storage is unavailable. Changes work in this session but may not survive refresh.';}}
export const useDemo=create<Store>((set,get)=>({data:null,user:null,ready:false,storageError:'',toast:'',
 init:()=>{if(get().ready)return;let data:DemoData,user:User|null=null,error='';try{const raw=localStorage.getItem(KEY);if(raw)({data,user}=decodeStored(raw));else data=seed();}catch{data=seed();error='Saved demo data could not be read. A fresh synthetic dataset has been loaded.';}error=error||persist(data,user);set({data,user,ready:true,storageError:error});},
 switchRole:(role,id)=>{const data=get().data!;const user=persona(data,role,id);set({user,storageError:persist(data,user)});},
 signOut:()=>{set({user:null,storageError:persist(get().data!,null)});},
 act:(action)=>{try{const data=transition(get().data!,get().user!,action);const user=get().user?persona(data,get().user!.role,get().user!.entityId):null;set({data,user,storageError:persist(data,user)});return true;}catch(e){set({toast:e instanceof Error?e.message:'Action could not be completed.'});return false;}},
 reset:()=>{const data=seed();set({data,user:null,storageError:persist(data,null),toast:'Demo data reset. Choose a persona to begin again.'});},message:toast=>set({toast})}));
