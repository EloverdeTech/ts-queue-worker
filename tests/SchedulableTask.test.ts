import {SampleSchedulableTask} from './helpers/SampleSchedulableTask';
import { assert } from 'chai';

describe('SchedulableTask', () => {

    beforeEach(() => {
    });

    afterEach(() => {
    });
    let task = new SampleSchedulableTask('default');

    it('can serialize task', (done) => {
        
        let taskSerialized = task.serialize();
        let isString;

        if(JSON.parse(taskSerialized)) {
            isString = true;
        } else {
            isString = false;
        }
        
        assert.equal(true, isString);

        done();
    });

    it('can decorate task', (done) => {
        let sample= SampleSchedulableTask.decorate({name: 'aaa'});
        let isObject;

        if(JSON.stringify(sample)) {
            isObject = true;
        } else {
            isObject = false;
        }

        assert.equal(true, isObject);

        done();       
    });

    it('can dispatch task', (done) => {
        
        task.dispatch();

        let storedLocal;

        if(localStorage.getItem('queue.default')){
            storedLocal = true; 
        } else {
            storedLocal = false;
        }
        
        assert.equal(true, storedLocal);

        done();    

    });

    it('can handle task', (done) => {
        
        task.handle().then((response)=>{
            assert.equal(17, response);
        });
        done();
    });


});