# Handle crashes

In this section, we will identify every possible error that can occur in our worker process (web server application) and see what we can do to catch and report those.

For each error case, we will  
 * add a GET api route on the `Express` worker server 
 * add some code behind it to simulate the error
 * see what must be done to handle the error correctly
 * see if the master process is able to restart (refork) the server or not

## Table of Content

 * [Crash in the root flow](crash-in-root-flow.md)
 * [Crash in the api root flow](crash-in-api-root-flow.md)
 * [Crash in async method](crash-in-async-method.md)
 * [Crash in promise rejection](crash-in-promise-rejection.md)
 * [Master kill/disconnect worker](master-kill-disconnect-worker.md)
 * [Worker stop/exit by itself](worker-stop-exit-itself.md)
 * [Miscellaneous](miscellaneous.md)