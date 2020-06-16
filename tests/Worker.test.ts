import {Worker} from '../src/Worker';
import { SampleSchedulableTask } from './helpers/SampleSchedulableTask';
import { SchedulableTask } from '../dist';
import { assert } from 'chai';

describe('Worker', () => {

    beforeEach(() => {
        localStorage.clear(); 
    });

    afterEach(() => {
    });

    it('can remove task', (done) => {
        
        let task = new SampleSchedulableTask('default');

        Worker.removeTask(0, 'default');

        assert.lengthOf(Worker.getTasks('default'), 0);

        done();

    });


    it('can run', (done) => {

        let task = new SampleSchedulableTask('ameno');
        
        task.dispatch();
        Worker.withProviders([SampleSchedulableTask])

        Worker.up();
        
        setTimeout(() =>{
            
            Worker.stop().then(()=>{

                assert.exists([], Worker.getTasks('default'));

                done();
                
            })
        }, 700)


    });

    it('can stop', (done) => {

        Worker.stop().then(()=>{
            done(); 
        });
        
    });

    it('can add queue', (done) => {
        
        let task = new SampleSchedulableTask('teste');
        Worker.saveTasks(task, []);

        done();
    });

    it('can get queue', (done) => {

        let task = new SampleSchedulableTask('default');
        Worker.addTask(task);

        assert.equal(Worker.getTasks('default')[0], '{"queue":"default","tries":0,"storageKey":"SampleSchedulableTask","name":"default"}')
        
        done();

    });

    it('can run once', (done) => {

        let task = new SampleSchedulableTask('default');
        
        Worker.addTask(task)
        Worker.stop().then(()=>{
        
            Worker.runOnce('default').then(() => {
                done(); 
    
            }).catch((error) => {
                assert.equal(true, false);
            });

        })
        
    });

    it('run on the time limit', (done) => {
        done();
    });

   

    


});