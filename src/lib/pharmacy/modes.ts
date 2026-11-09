export type AppRole='coordinator'|'operator';
export type RoleProfile={role?:string;roles?:string[];mode?:string};
export function rolesFor(user:RoleProfile|null|undefined):AppRole[]{
 const roles=Array.isArray(user?.roles)?user.roles:[user?.role];
 return roles.filter((r):r is AppRole=>r==='coordinator'||r==='operator');
}
export function modeFor(user:RoleProfile,requested?:AppRole|null):AppRole{
 const roles=rolesFor(user);
 if(requested&&roles.includes(requested))return requested;
 if((user.mode==='coordinator'||user.mode==='operator')&&roles.includes(user.mode))return user.mode;
 return roles.includes('coordinator')?'coordinator':'operator';
}
