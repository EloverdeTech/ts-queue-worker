import { SchedulableTask } from ".";

export class Queue {

    public key: string;
    public timeCycle: number;
    public intervalId?: number; 
    public isRunning: boolean;

    constructor(key){
        this.key = key;
    }
    
}