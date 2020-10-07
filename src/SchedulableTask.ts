import { Queue } from "./Queue";
import { Worker } from "./Worker";

export abstract class SchedulableTask {
    public id = Date.now();
    public queue = 'default';
    public tries = 0;
    public lastExecuted: Date;
    public errors: Array<string>;

    public storageKey = this.constructor.name;

    abstract handle(): Promise<any>;

    abstract afterHandle(data);

    public async dispatch() {        
        await Worker.addTask(this);
    }

    public serialize() {
        return JSON.stringify(this);    
    }
    
    public static decorate(jsonObject) {
        
        let obj = new (<any>this);
        
        for (let prop in jsonObject) {
            obj[prop] = jsonObject[prop];        
        }

        return obj;
    }

} 