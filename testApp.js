const {isMainThread, Worker} = require('worker_threads');

//const mongoose = require('mongoose');
//const dbName = 'mongodb://127.0.0.1:27017/twoArmedTask2020';


function createWorker(path, wd) {
  const w = new Worker(path, {workerData: wd});

  w.on('error', (err) => {
    console.error(`Worker ${w.workerData} error`)
    console.error(err);
  });

  w.on('exit', (exitCode) => {
    console.log(`exitted! : ${wd}`);
  });

  w.on('message', (msg) => {
    // workerスレッドから送信されたメッセージ
    console.log(`[Main] Message got from worker ${msg}`)
  });
  return w;
}

console.log(`[Main] isMainThread: ${isMainThread}`);
for (let i = 0; i < 5; i++) {
  const worker = createWorker('./worker_threads/heavy_thread.js', i);
}