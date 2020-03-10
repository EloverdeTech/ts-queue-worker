import { SchedulableTask } from "./SchedulableTask";
import { Queue } from "./Queue";

export class Worker {

    private static queues: Array<Queue> = [{ key: 'default', timeCycle: 1000, isRunning: false }];
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

    public static addTask(task: SchedulableTask) {

        let taskToStorage = task.serialize();
        let queueName = 'queue.' + task.queue;

        let queue = this.getTasks(queueName);
        let newQueue;


        if (queue) {
            newQueue = queue;
        } else {
            newQueue = [];
        }


        newQueue.push(taskToStorage);

        this.saveTasks(task.queue, newQueue);

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
            }

        })

    }


    public static runOnce(queueName = 'default') {

        return new Promise((resolve, reject) => {

            console.info(queueName + ' - running worker cycle...')
            let queue = this.queues.find((queue => queue.key == queueName));
            if (queue) {

                let taskList = this.getTasks(queueName);


                //Se não houver um outro ciclo rodando
                if (!queue.isRunning) {

                    if (taskList && taskList.length) {

                        this.runTask(queue, taskList[0], taskList).then((response) => {
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

    private static runTask(queue, task, taskList) {

        return new Promise((resolve, reject) => {

            //Marca o ciclo como em execução
            queue.isRunning = true;

            let taskProvider = this.getProvider(JSON.parse(task).storageKey);
            let decoratedTask = taskProvider.decorate(JSON.parse(task));

            if (decoratedTask) {

                decoratedTask.handle().then((response) => {

                    taskList.splice(0, 1);

                    this.saveTasks(decoratedTask.queue, taskList);
                    this.afterRun(queue);
                    resolve();

                }).catch((error) => {

                    decoratedTask.lastExecuted = new Date();
                    decoratedTask.tries++;

                    decoratedTask.errors = decoratedTask.errors ? decoratedTask.errors : []
                    decoratedTask.errors.push(JSON.stringify(error, null, 2));;
                    decoratedTask.errors = decoratedTask.errors.slice(-5);

                    taskList.splice(0, 1);
                    this.saveTasks(decoratedTask.queue, taskList);

                    this.addTask(decoratedTask);

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

    public static saveTasks(queueName, queueData: Array<SchedulableTask>) {
        let dataToStorage = JSON.stringify(queueData)
        localStorage.setItem('queue.' + queueName, dataToStorage);
    }


    public static getTasks(queueName) {

        let queue = localStorage.getItem('queue.' + queueName);

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
            this.queues.forEach((queue: Queue) => {

                let recursiveStop = () => {

                    setTimeout(() => {

                        //Se estiver rodando um ciclo, espera até acabar
                        if (queue.isRunning) {
                            recursiveStop();
                        } else {
                            //Se não estiver executando, para o worker
                            clearInterval(queue.intervalId)
                            resolve();
                        }

                    }, 500)

                }

                recursiveStop();

            });
        });
    }

}