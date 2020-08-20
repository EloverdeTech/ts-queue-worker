import {SchedulableTask} from '../../dist';

export class SampleSchedulableTask extends SchedulableTask {
    public name;

    constructor(name){
        super();
        this.name = name;
    }    
    
    handle(){
        return new Promise((resolve, reject) =>{
            resolve(11+6);
        });
    }

    afterHandle(data) {
        
    }



}