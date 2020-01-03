export const defaultCode = `
interface ITest{
  [name:string]?: number
}
export function extra1(){
  console.log('extra')
}
function extra2(name1:string,name2:string){
  console.log(name1,name2)
}
class Demo extends DemoBase{
  static active: boolean = false;
  private secret: string|number;
  private base:DemoBase;

  constructor() {
    super('demo')
    this.secret = "cool";
  }

  public print() {
    console.log(this.secret);
  }

  public greet(name:string) {
    console.log(name)
  }
}
class DemoBase {
  private base:string;
  constructor (name:string) {
    this.base = name
  }
}
export default Demo
`
