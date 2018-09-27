# Node.js Scaling

* **Single Thread** - while `single-threaded`, non-blocking performance is quite good, eventually, 1 process in 1 CPU is not going to be enough to handle an increasing workload of an application. No matter how powerful the server you use can be, what a single thread can support is limited. 

* **Multiple processes** - The fact that `node` runs in a single thread does not mean that we can't take advantage of multiple processes, and of course, multiple machines as well.  Using **multiple processes is the only way to scale a Node.js application**. 

> `Node.js` is designed for building distributed applications with many nodes (this is why it's named `Node.js`). Scalability is baked into the platform and it's not something you start thinking about later in the lifetime of an application. 

* **Why Scaling application** - `Workload` is the most popular reason we scale applications, but we also scale applications to increase their `availability` and `tolerance to failure`. 

* **Scaling Strategies** - There are mainly 3 things we can do to scale an application. 
    * **Cloning** - clone the application multiple times and have each cloned instance handle part of the workload. 
    * **Decomposing** - decomposing the application based on functionalities and microservices in a way that gurrantees a loose coupling way and high cohesion between services. This implies having different applications/code bases, own dedicated databases, ...
    * **Splitting** - split the application into multiple instances where each instance is responsible for only a portion of the application's data. (`horizontal partitioning` or `sharding` in database vocabulary)
    The cluster module can be used to enable `load balancing` over an environment multiple CPU cores. It's based on the `fork` function. It forks the main application process as many times as we have CPU cores, and then it will take over and load balance all requests to the main process across all forked processes. `Node.js Cluster Module` implements the `cloning scalability strategy` on one machine (only). 
