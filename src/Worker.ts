import { SchedulableTask } from "./SchedulableTask";
import { Queue } from "./Queue";
import * as localforage  from 'localforage';

export class Worker {

    private static queues: Array<Queue> = [{ key: 'default', timeCycle: 5000, isRunning: false }];
    private static providers = {};

    public static withProviders(providers: Array<SchedulableTask> | object) {
        if (Array.isArray(providers)) {

            providers.forEach((provider: SchedulableTask) => {
                this.providers[(new (<any>provider)).constructor.name] = provider;
            })

        } else {
            this.providers = providers;
        }

    }

    public static getProvider(key: string) {

        if (this.providers[key]) {
            return this.providers[key];
        }

        throw new Error('Provider with key ' + key + ' not found!');

    }

    public static async addTask(task: SchedulableTask) {

        let taskToStorage = task.serialize();
        let queueName = task.queue;

        let queue = await this.getTasks(queueName);   
        let newQueue;
    
        if (queue) {
            newQueue = queue;
        } else {
            newQueue = [];
        }


        newQueue.push(taskToStorage);

        await this.saveTasks(task.queue, newQueue);

    }

    public static removeTasks(ids: Array<number>, queueName) {
        return new Promise(async (resolve, reject) => {
            
            let queue = await this.getTasks(queueName);
            
            ids.forEach((id) => {
                let taskIndex = queue.findIndex(task => {
                    task.id == id
                    let taskProvider = this.getProvider(JSON.parse(task).storageKey);
                    let decoratedTask: SchedulableTask = taskProvider.decorate(JSON.parse(task));
                    if (decoratedTask.id === id) {
                        return task;
                    }
                });
                queue.splice(taskIndex, 1);
            })
    
            await this.saveTasks(queueName, queue);
            resolve();
        });
    }


    public static up() {

        this.queues.forEach((queue: Queue) => {

            if (!queue.intervalId) {

                queue.intervalId = setInterval(() => {

                    this.runOnce(queue.key).then(() => {
                        return 'sucess';
                    }).catch((error) => {
                        return error;
                    });

                }, queue.timeCycle)
            } else {
                console.error('queue already running')
            }

        })

    }


    public static runOnce(queueName = 'default') {

        return new Promise(async (resolve, reject) => {

            console.info(queueName + ' - running worker cycle...')
            let queue = this.queues.find((queue => queue.key == queueName));
            if (queue) {

                let taskList = await this.getTasks(queueName);


                //Se não houver um outro ciclo rodando
                if (!queue.isRunning) {

                    if (taskList && taskList.length) {

                        this.runTask(queue, taskList[0], taskList, queueName).then((response) => {
                            resolve();
                        }).catch((error) => {
                            reject(error);
                        });

                    }

                } else {
                    reject('queueStillRunning');
                }

            } else {
                reject('queueNotFound');
            }

        });
    }

    private static runTask(queue, task, taskList, queueName) {

        return new Promise((resolve, reject) => {

            //Marca o ciclo como em execução
            queue.isRunning = true;

            let taskProvider = this.getProvider(JSON.parse(task).storageKey);
            let decoratedTask: SchedulableTask = taskProvider.decorate(JSON.parse(task));
            
            if (decoratedTask) {

                decoratedTask.handle().then(async (response) => {

                    let newTaskList = await this.getTasks(queueName);
                    let taskIndex  = newTaskList.findIndex(listedTask => task === listedTask);

                    console.log(taskIndex);
                    newTaskList.splice(taskIndex, 1);

                    await this.saveTasks(decoratedTask.queue, newTaskList);
                    
                    decoratedTask.afterHandle(decoratedTask);   
                    this.afterRun(queue);
                    resolve();

                }).catch(async (error) => {
                    decoratedTask.lastExecuted = new Date();
                    decoratedTask.tries++;

                    decoratedTask.errors = decoratedTask.errors ? decoratedTask.errors : []
                    decoratedTask.errors.push(JSON.stringify(error, null, 2));;
                    decoratedTask.errors = decoratedTask.errors.slice(-5);

                    let newTaskList = await this.getTasks(queueName);
                    let taskIndex  = newTaskList.findIndex(listedTask => task === listedTask);
                    console.log(taskIndex);

                    newTaskList.splice(taskIndex, 1);
                    
                    await this.saveTasks(decoratedTask.queue, newTaskList);

                    await this.addTask(decoratedTask)
                    
                    this.afterRun(queue);
                    reject('taskError');
                       
    
                });
            } else {
                this.afterRun(queue);
                reject('runningQueue');
            }

        });
    }

    public static afterRun(queue) {
        queue.isRunning = false;
    }

    public static async saveTasks(queueName, queueData: Array<SchedulableTask>) {
        let dataToStorage = JSON.stringify(queueData)
        await localforage.setItem('queue.' + queueName, dataToStorage)
    }


    public static async getTasks(queueName) {
        let queue: string | null = await localforage.getItem('queue.' + queueName);

        if (queue) {
            let queueParsed = JSON.parse(queue);

            return queueParsed
        } else {
            return [];
        }

    }

    /**
     * Derruba o worker
     */
    public static stop() {

        return new Promise((resolve, reject) => {
            this.queues.map((queue: Queue) => {

                let recursiveStop = () => {

                    setTimeout(() => {

                        //Se estiver rodando um ciclo, espera até acabar
                        if (queue.isRunning) {
                            recursiveStop();
                        } else {
                            //Se não estiver executando, para o worker
                            clearInterval(queue.intervalId)
                            queue.intervalId = undefined;
                            resolve();
                        }

                    }, 500)

                }

                recursiveStop();

            });
        });
    }

}