export function DateToUserFreindlyString(date:Date):string|undefined{
    if(date===undefined) return undefined;
    const timeString = date.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' });

    const isToday = (date:Date) => {
      const today = new Date();
      return date.getDate() === today.getDate() &&
             date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear();
    };
    
    return isToday(date) ? `Today ${timeString}` : date.toDateString();
    
}
export function DurationToUserFreindlyString(duration:number):string|undefined{
  const addDigit = (number:number)=>{
    return (number<10 && number>=0 )?`0${number}`: number.toString();
  }
  if(duration===undefined) return "00:00";
  
  let d = new Date(duration);

  return  ` ${addDigit(d.getMinutes())}:${addDigit(d.getSeconds())}`
  
}

export function delay(ms:number):Promise<void>{
   return new Promise((resolve,reject)=>{
     setTimeout(()=>{resolve()},ms);
   })

}