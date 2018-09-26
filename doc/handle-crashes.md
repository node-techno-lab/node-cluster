# Handle crashes

In this section, we will try to identify every possible error our worker proicess (web server app) can encounter, catch and report those.

For each error case, we will  
 * add GET an api route on the `Express` worker server 
 * add some code to simulate the error
 * see what must be done to handle the error correctly
 * see if the master process is able to restart (refork) the server or not

 * [Crash in the root flow](crash-in-root-flow.md)
 * [Crash in the api root flow](crash-in-api-root-flow.md)
 * [Crash in async method](crash-in-async-method.md)
 * [Crash in promise rejection](crash-in-promise-rejection)