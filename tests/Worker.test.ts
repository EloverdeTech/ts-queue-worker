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

    it('can remove task', function (done) {
        new Promise(async function (resolve) {
            let task = new SampleSchedulableTask('default');

            Worker.removeTasks([0], 'default');
            let tasks = await Worker.getTasks('default');
                assert.lengthOf(tasks, 0);

          assert.ok(true);
          resolve();
         })
        .then(done);
    });


    it('can run', (done) => {

        let task = new SampleSchedulableTask('ameno');
        
        task.dispatch();
        Worker.withProviders([SampleSchedulableTask])

        Worker.up();
        
        setTimeout(() =>{
            
            Worker.stop().then(async ()=>{

                assert.exists([], await Worker.getTasks('default'));

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

        
        done();

    });

    it('can get queue', function (done) {
        this.timeout(5000);
        new Promise(async function (resolve) {
            let task = new SampleSchedulableTask('default');
            
            await Worker.addTask(task);   
            const tasks = await Worker.getTasks('default');
            
            assert.equal(tasks[0], '{"id":'+task.id+',"queue":"default","tries":0,"storageKey":"SampleSchedulableTask","name":"default"}')
    
          resolve();
         })
        .then(done);
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