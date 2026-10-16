/*
 * Topic: Scalability
 * Learned from:
 *   - CS75 Scalability lecture (David Malan, Harvard)
 *   - "Scalability for Dummies" series (lecloud.net), parts 1-4
 *
 * `sources` = the "Learn more" links: the best beginner-friendly page per concept.
 */

const link = (label, url) => ({ label, url });
const PRIMER = (anchor, title) =>
  link(`System Design Primer: ${title}`, `https://github.com/donnemartin/system-design-primer#${anchor}`);

const VIDEO = link(
  "Video: CS75 Scalability lecture (David Malan, Harvard)",
  "https://www.youtube.com/watch?v=-W9F__D3oY4"
);
const blog = (part) =>
  link(
    `Scalability for Dummies - ${part}`,
    "https://web.archive.org/web/20221030091841/http://www.lecloud.net/tagged/scalability/chrono"
  );
const CLONES = blog("Part 1: Clones");
const CACHE = blog("Part 3: Cache");
const ASYNC = blog("Part 4: Asynchronism");

const MDN_CLIENT_SERVER = link(
  "MDN: Client-server overview",
  "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/First_steps/Client-Server_overview"
);
const MDN_WEB_SERVER = link(
  "MDN: What is a web server?",
  "https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_web_server"
);
const GFG_SCALING = link(
  "GeeksforGeeks: Horizontal vs vertical scaling",
  "https://www.geeksforgeeks.org/system-design/system-design-horizontal-and-vertical-scaling/"
);
const REDIS_SESSIONS = link("Redis: Session management", "https://redis.io/solutions/session-management/");

const nodes = [
  {
    id: "scalability",
    title: "Scalability",
    aliases: ["scale", "scaling", "scalable"],
    level: 1,
    concern: "foundations",
    kind: "idea",
    prereqs: ["server"],
    short: "Can your system handle more users without breaking or slowing down?",
    what: "Scalability is the ability of a system to handle **more work** (more users, more requests, more data) by adding more resources, without becoming slow or crashing.",
    example: [
      "Think of a chai stall near college. 20 customers a day? One person makes chai easily.",
      "Suddenly 500 students come every morning. The owner can either buy a **bigger stove and kettle** (scale up) or **hire 4 more people with 4 more stoves** (scale out). If the stall can grow like this and still serve everyone quickly, it is scalable."
    ],
    why: "Apps start small but can grow overnight: a post goes viral, exam results are announced, a sale starts. If the system can't grow, users see errors and leave.",
    remember: "Scalable = more users, same speed.",
    sources: [PRIMER("performance-vs-scalability", "Performance vs scalability"), VIDEO]
  },
  {
    id: "server",
    title: "Server",
    aliases: ["web server", "machine", "client"],
    level: 1,
    concern: "foundations",
    kind: "idea",
    short: "A computer that waits for requests and sends back responses.",
    what: "A server is just a computer (usually without a screen) running a program that listens for requests like 'give me the home page' and replies with an answer. The device asking is called the **client**.",
    example: "A waiter in a restaurant: you (the client) ask for a dosa, the waiter (the server) goes, gets it and brings it back. When you open instagram.com, your phone is the client and Instagram's computer is the server.",
    why: "Every website or app you use talks to servers. Scalability is mostly about one question: **what do we do when one server is not enough?**",
    remember: "Client asks, server answers.",
    sources: [MDN_CLIENT_SERVER, MDN_WEB_SERVER]
  },
  {
    id: "session",
    title: "Session",
    aliases: ["cookie", "session id", "login state"],
    level: 2,
    concern: "foundations",
    kind: "idea",
    prereqs: ["server"],
    short: "The server's memory of who you are between clicks.",
    what: [
      "The web forgets you after every request. A **session** is a small piece of data, like 'user = Riya, logged in, cart = 2 items', that the server keeps so it remembers you on the next click.",
      "Your browser holds a **cookie** with a session ID that points to that data."
    ],
    example: "At a coat check you hand over your bag and get a token number. Next time you show the token, they know which bag is yours. The **token is the cookie**; the **bag on the shelf is the session**.",
    why: "Without sessions you'd have to log in again on every page, and your shopping cart would be empty every time. With many servers, the big question becomes: **where is the bag kept?**",
    remember: "Cookie = token, session = your bag on the shelf.",
    sources: [link("MDN: Using HTTP cookies", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies")]
  },

  {
    id: "vertical-scaling",
    title: "Vertical Scaling",
    aliases: ["scale up", "scaling up", "bigger machine"],
    level: 1,
    concern: "scaling",
    kind: "technique",
    prereqs: ["scalability"],
    short: "Make one machine bigger: more CPU, more RAM, bigger disk.",
    what: "Vertical scaling (**scaling up**) means upgrading the same server with more powerful parts: a faster CPU, more RAM, bigger or faster disks.",
    example: "Your laptop is slow, so you add 16 GB more RAM and an SSD. Same laptop, more power. The chai-wala buys a bigger stove.",
    why: "It's the easiest first step: no code changes, the app just runs faster.",
    pros: ["Simple: no change to your code", "Only one machine to manage"],
    cons: [
      "There is a ceiling: you can't buy an infinitely big machine",
      "Price grows very fast for top-end hardware",
      "Still one machine. If it dies, everything is down (single point of failure)"
    ],
    remember: "Bigger machine. Easy, but it has a limit.",
    sources: [GFG_SCALING]
  },
  {
    id: "horizontal-scaling",
    title: "Horizontal Scaling",
    aliases: ["scale out", "scaling out", "more machines"],
    level: 1,
    concern: "scaling",
    kind: "technique",
    prereqs: ["scalability", "vertical-scaling"],
    short: "Add more machines and share the work between them.",
    what: "Horizontal scaling (**scaling out**) means adding more servers, often cheap ordinary ones, and splitting the incoming work among them.",
    example: "Instead of hiring one super-fast cashier, a supermarket opens 10 billing counters. Each cashier is normal, but together they handle the Diwali rush.",
    why: "There's no hard ceiling: need more capacity? Add more machines. And if one machine dies, the others keep working.",
    pros: [
      "Almost no upper limit",
      "Uses cheaper, ordinary machines",
      "One machine failing doesn't stop the service"
    ],
    cons: [
      "Needs something to decide which machine gets each request (a load balancer)",
      "Servers must not keep private memory of users (they must be stateless)",
      "More machines = more things to manage and keep in sync"
    ],
    remember: "More machines. Needs a load balancer and stateless servers.",
    sources: [GFG_SCALING, PRIMER("horizontal-scaling", "Horizontal scaling")]
  },
  {
    id: "stateless-server",
    title: "Stateless Servers (Clones)",
    aliases: ["stateless", "clones", "identical servers"],
    level: 2,
    concern: "scaling",
    kind: "principle",
    prereqs: ["horizontal-scaling", "session"],
    short: "Every server is an identical copy and remembers nothing about users.",
    what: "A stateless server keeps **no user data** (sessions, uploaded files) on itself. Everything that must be remembered goes to a shared place like a database or cache. So all servers are identical clones and **any of them can answer any request**.",
    example: "At McDonald's, any cashier can take your order: the menu and prices are the same at every counter, and your order goes to one common kitchen screen. You don't care which cashier you get.",
    why: "Only when servers are interchangeable can the load balancer send you anywhere, and only then can you add or remove servers freely.",
    pros: [
      "Add or remove servers any time",
      "A server dying loses no user data",
      "The load balancer can use any simple strategy"
    ],
    cons: ["You need a shared store for sessions and files, which is one more system to run"],
    remember: "Golden rule: servers forget, the shared store remembers.",
    sources: [CLONES, REDIS_SESSIONS]
  },
  {
    id: "central-session-store",
    title: "Central Session Store",
    aliases: ["shared sessions", "session store", "redis sessions"],
    level: 2,
    concern: "scaling",
    kind: "technique",
    prereqs: ["stateless-server"],
    short: "Keep all sessions in one shared, fast store instead of on each server.",
    what: "Instead of each server keeping its own sessions, all servers read and write sessions in **one shared, fast store**, usually an in-memory store like Redis (or a database).",
    example: "Instead of each bank employee keeping customer files in their own drawer, all files live in a central record room. Whichever employee you meet, they fetch your file from there.",
    why: "This is what makes servers stateless, so you no longer need sticky sessions.",
    pros: ["Any server can serve any user", "A server crash doesn't log users out"],
    cons: [
      "The store itself must be fast and highly available, or it becomes the new single point of failure",
      "One extra network call per request (tiny if the store is in-memory)"
    ],
    remember: "Sessions live in one shared place, not on the servers.",
    sources: [REDIS_SESSIONS]
  },
  {
    id: "shared-storage",
    title: "Shared File Storage",
    aliases: ["nfs", "s3", "object storage", "uploads", "file server"],
    level: 3,
    concern: "scaling",
    kind: "technique",
    prereqs: ["stateless-server"],
    short: "Files users upload must live where every server can reach them.",
    what: "If a user uploads a profile photo to server 1 and their next request goes to server 2, server 2 doesn't have the photo. The fix is to store files in a **shared place**: a network file system (NFS) or, today, object storage like **Amazon S3**.",
    example: "Instead of each teacher keeping assignment submissions in their own bag, everyone submits to one shared Google Drive folder that all teachers can open.",
    remember: "Files go to shared storage, never to one server's disk.",
    sources: [link("AWS: What is object storage?", "https://aws.amazon.com/what-is/object-storage/")]
  },
  {
    id: "deployment-consistency",
    title: "Same Code Everywhere",
    aliases: ["deployment", "server image", "ami", "capistrano", "golden image"],
    level: 3,
    concern: "scaling",
    kind: "technique",
    prereqs: ["stateless-server"],
    short: "All clones must run exactly the same code and settings.",
    what: [
      "With 10 servers, a new release must reach all 10. If server 3 still runs old code, users get different behaviour depending on which server they hit.",
      "Deploy tools (like Capistrano) update all servers together. A **server image** (like an AWS AMI) is a saved snapshot of a perfectly set-up server that you copy to create new identical servers."
    ],
    example: "Domino's gives every outlet the same recipe book. If one outlet uses an old recipe, your pizza tastes different depending on where you order. A 'master outlet template' lets them open new outlets that are identical from day one.",
    remember: "Bake one golden image and copy it.",
    sources: [link("Docker: What is a container (and an image)?", "https://www.docker.com/resources/what-container/"), link("AWS docs: Amazon Machine Images (AMI)", "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AMIs.html")]
  },

  {
    id: "load-balancer",
    title: "Load Balancer",
    aliases: ["lb", "haproxy", "nginx", "traffic distribution"],
    level: 1,
    concern: "traffic",
    kind: "technique",
    prereqs: ["horizontal-scaling"],
    short: "The traffic police that sends each request to one of many servers.",
    what: "A load balancer sits **in front of your servers**. Every user request reaches it first, and it forwards the request to one of the servers behind it, trying to keep them all equally busy. Users only ever see one address: the load balancer's.",
    example: "A big hospital has one reception desk. Patients don't pick a doctor themselves; the receptionist sends each patient to a doctor who is free. The receptionist is the load balancer.",
    why: "Once you have many servers (horizontal scaling), something has to spread the work and skip servers that are down.",
    details: [
      "**Round robin**: server 1, 2, 3, 1, 2, 3… in turn",
      "**Least connections**: send to whichever server is least busy right now",
      "**By user (IP hash / cookie)**: the same user always goes to the same server",
      "Software balancers: HAProxy, Nginx, LVS. Hardware ones (Citrix, F5) are fast but very expensive",
      "Often does **SSL termination**: it decrypts HTTPS once, so the servers behind it don't have to"
    ],
    pros: [
      "Spreads traffic evenly",
      "Stops sending traffic to a dead server",
      "Hides the servers' private addresses; only the balancer is public"
    ],
    cons: [
      "It can itself become a single point of failure, so companies run two (one active, one on standby)",
      "Can break logins if sessions are stored on individual servers"
    ],
    remember: "One entrance, many workers behind it.",
    sources: [link("Cloudflare: What is load balancing?", "https://www.cloudflare.com/learning/performance/what-is-load-balancing/"), PRIMER("load-balancer", "Load balancer")]
  },
  {
    id: "dns-round-robin",
    title: "DNS Round Robin",
    aliases: ["dns", "round robin"],
    level: 3,
    concern: "traffic",
    kind: "technique",
    prereqs: ["load-balancer"],
    short: "The simplest load balancing: DNS hands out a different server address each time.",
    what: "DNS is the internet's phonebook: it turns 'google.com' into an IP address. With round robin, DNS keeps several IPs for one name and hands them out in turn: first person gets server 1, next gets server 2, then server 3, then back to 1.",
    example: "A teacher forms project groups by counting 1-2-3, 1-2-3 down the class, without checking who is already busy or absent.",
    pros: ["Very simple and almost free; no extra machine needed"],
    cons: [
      "It doesn't know if a server is busy or dead, so it keeps sending users there",
      "Browsers and computers cache the DNS answer, so a heavy user can stick to one server for hours",
      "Uneven: by luck, one server may get all the heavy users"
    ],
    remember: "Takes turns blindly.",
    sources: [link("Cloudflare: What is round-robin DNS?", "https://www.cloudflare.com/learning/dns/glossary/round-robin-dns/"), link("Cloudflare: What is DNS?", "https://www.cloudflare.com/learning/dns/what-is-dns/")]
  },
  {
    id: "sticky-sessions",
    title: "Sticky Sessions",
    aliases: ["session affinity", "sticky"],
    level: 2,
    concern: "traffic",
    kind: "technique",
    prereqs: ["load-balancer", "session"],
    short: "Always send the same user to the same server.",
    what: "If sessions are stored inside each server's own memory, a user must always return to that same server or they'll appear logged out. A **sticky session** makes the load balancer remember 'user A → server 2', often by putting the server's ID in a cookie.",
    example: "At a bank you started your loan file with Mr. Sharma. If next time the receptionist sends you to Ms. Gupta, she knows nothing about your file. So the bank says: 'always go to Mr. Sharma'.",
    why: "A quick fix that makes logins and carts work when you have several servers.",
    pros: ["Easy fix; no new database needed"],
    cons: [
      "If that server dies, the user's session is lost",
      "Load becomes uneven: one server may collect many heavy users",
      "Works against the idea of interchangeable servers"
    ],
    remember: "Quick fix. The better fix is a central session store.",
    sources: [link("Wikipedia: Load balancing - Persistence (sticky sessions)", "https://en.wikipedia.org/wiki/Load_balancing_(computing)#Persistence")]
  },

  {
    id: "single-point-of-failure",
    title: "Single Point of Failure",
    aliases: ["spof"],
    level: 1,
    concern: "up",
    kind: "problem",
    prereqs: ["server"],
    short: "One part whose failure brings down the whole system.",
    what: "A single point of failure (SPOF) is any component that **stops everything if it breaks**, because there is no backup for it.",
    example: "A classroom with only one door: if it jams, nobody gets in or out. A wedding with one generator: if it fails, the whole function goes dark.",
    why: "Even after you add many web servers, a single load balancer, a single database or a single network switch can still take everything down. Good design hunts down every SPOF and gives it a backup.",
    remember: "Count the 'only ones'. Each one is a SPOF.",
    sources: [link("Wikipedia: Single point of failure", "https://en.wikipedia.org/wiki/Single_point_of_failure")]
  },
  {
    id: "high-availability",
    title: "High Availability",
    aliases: ["ha", "failover", "uptime", "heartbeat", "active-passive", "active-active"],
    level: 1,
    concern: "up",
    kind: "principle",
    prereqs: ["single-point-of-failure", "redundancy"],
    short: "The system keeps running even when some parts fail.",
    what: "High availability (HA) means designing the system so it stays up almost all the time, by having **backups for every important part** and switching to them automatically.",
    example: "An airplane has two engines and two pilots. If one engine or one pilot fails, the flight continues.",
    details: [
      "**Active–Passive**: one machine works and the other waits. They send each other a 'heartbeat' every second. If the active one stops responding, the passive one takes over",
      "**Active–Active**: both machines work at the same time and share the load. If one dies, the other carries everything",
      "Availability is measured in 'nines': 99.9% ≈ 8.7 hours down per year, 99.99% ≈ 52 minutes per year"
    ],
    pros: ["Users rarely see downtime"],
    cons: ["Costs more because you pay for backup machines", "More complex: failover must be tested regularly"],
    remember: "Two of everything important, plus automatic switch-over.",
    sources: [link("DigitalOcean: What is high availability?", "https://www.digitalocean.com/community/tutorials/what-is-high-availability"), PRIMER("availability-in-numbers", "Availability in numbers")]
  },
  {
    id: "redundancy",
    title: "Redundancy",
    aliases: ["duplicate", "duplication", "copies", "backup"],
    level: 2,
    concern: "up",
    kind: "idea",
    prereqs: ["single-point-of-failure"],
    short: "Keeping extra copies of something, on purpose (for safety or speed) or by accident (messy data).",
    what: [
      "Redundancy means **the same thing exists in more than one place**. In system design it shows up in two ways:",
      "**1. Redundant machines**: extra servers or disks, so if one dies another takes over.",
      "**2. Redundant data**: the same data stored in several places, rows or tables."
    ],
    example: [
      "You keep your college documents in Google Drive, on a pen drive and as a printout. If your laptop dies, you still have them. That's **good redundancy**.",
      "But if you change your address and update only the printout, your copies now disagree. That's the **danger of redundant data**."
    ],
    why: "SQL databases usually **remove** redundant data (normalization) so copies can't disagree. NoSQL databases and big systems often **add it back on purpose** (denormalization, replication) because reading from one place is faster and copies protect against failure. That's why people say NoSQL has 'high redundancy'.",
    pros: ["Backups protect against failure", "Copies kept close to where they're needed make reads faster"],
    cons: [
      "Uses more storage",
      "Copies can disagree if one is updated and the others aren't (inconsistency)",
      "Updates are slower because every copy must change"
    ],
    remember: "Redundancy = copies. Great for safety and speed, risky for consistency.",
    sources: [link("Wikipedia: Data redundancy", "https://en.wikipedia.org/wiki/Data_redundancy"), PRIMER("availability-patterns", "Availability patterns")]
  },
  {
    id: "raid",
    title: "RAID",
    aliases: ["raid 0", "raid 1", "raid 5", "raid 6", "raid 10", "disks", "mirroring", "striping"],
    level: 3,
    concern: "up",
    kind: "technique",
    prereqs: ["redundancy"],
    short: "Combine several disks so data survives a dead disk (and/or reads faster).",
    what: "RAID (Redundant Array of Independent Disks) makes several hard disks work together as one.",
    example: "**RAID 1** is like two students writing the same class notes: if one loses their notebook, borrow from the other. **RAID 0** is two students each writing half the notes: faster, but if one notebook is lost, the notes are useless.",
    details: [
      "**RAID 0 (striping)**: splits data across 2+ disks for speed. No safety: one disk dies, all data is lost",
      "**RAID 1 (mirroring)**: the same data is written to 2 disks. One dies, the other has everything",
      "**RAID 5 / RAID 6**: data plus extra 'parity' info spread across 3+ disks. Survives 1 (RAID 5) or 2 (RAID 6) dead disks while wasting less space than mirroring",
      "**RAID 10**: mirroring + striping, for both speed and safety"
    ],
    remember: "RAID 1 = mirror. RAID 0 = speed only. RAID 5/6/10 = balance.",
    sources: [link("Wikipedia: Standard RAID levels (with diagrams)", "https://en.wikipedia.org/wiki/Standard_RAID_levels")]
  },
  {
    id: "firewall",
    title: "Firewall & Ports",
    aliases: ["security", "ports", "80", "443", "22", "ssl"],
    level: 2,
    concern: "up",
    kind: "tool",
    prereqs: ["load-balancer"],
    short: "Only let in the traffic you expect, through the doors (ports) you choose.",
    what: [
      "A firewall blocks all network traffic except what you allow. A **port** is like a numbered door on a machine.",
      "From the internet, only the load balancer should be reachable, on **port 80 (HTTP)** and **443 (HTTPS)**, plus **22 (SSH)** for admins. The database (MySQL uses **3306**) should accept connections only from your own web servers, never from the internet."
    ],
    example: "A college campus: the main gate is open for everyone (80/443), the staff gate only for staff (22), and the exam-paper room only for the exam department (the database).",
    why: "Least privilege: if a hacker gets in somewhere, they should be able to reach as little as possible.",
    remember: "Open only the doors you need.",
    sources: [link("Cloudflare: What is a firewall?", "https://www.cloudflare.com/learning/security/what-is-a-firewall/"), link("Cloudflare: What is a computer port?", "https://www.cloudflare.com/learning/network-layer/what-is-a-computer-port/")]
  },

  {
    id: "database",
    title: "Database (SQL)",
    aliases: ["sql", "mysql", "postgres", "relational", "rdbms", "table"],
    level: 1,
    concern: "data",
    kind: "idea",
    prereqs: ["server"],
    short: "Organised, permanent storage in tables, like Excel sheets that link to each other.",
    what: "A relational (SQL) database such as MySQL or PostgreSQL stores data in **tables** with rows and columns. Tables are linked by **IDs**, and you ask questions in SQL, e.g. 'give me all orders of user 42'.",
    example: "A college keeps a Students sheet (roll no, name), a Courses sheet (course id, name) and an Enrollments sheet (roll no, course id). Enrollments doesn't repeat the student's name; it only stores the roll number.",
    why: "It's usually the **hardest part to scale**. Stateless web servers are easy to clone, but data must stay correct and consistent.",
    remember: "Web servers are easy to clone. The database is the hard part.",
    sources: [link("SQLBolt: Learn SQL with interactive exercises", "https://sqlbolt.com/"), PRIMER("relational-database-management-system-rdbms", "Relational databases (RDBMS)")]
  },
  {
    id: "normalization",
    title: "Normalization",
    aliases: ["normal form", "normalize"],
    level: 2,
    concern: "data",
    kind: "principle",
    prereqs: ["database", "redundancy"],
    short: "Design tables so each fact is stored only once.",
    what: "Normalization means designing tables so that **the same information isn't repeated**. Instead of copying a customer's name into every order row, you store it once in a Customers table and keep only the customer ID in Orders.",
    example: "Your class WhatsApp group has one pinned message with the exam date. Everyone refers to it, and if the date changes you edit one message. Compare that with 60 students each writing the date in their own notes: change it, and half the class has the wrong date.",
    why: "It avoids redundant data: it saves space and stops copies from disagreeing.",
    pros: ["Each fact lives in one place, so copies can't mismatch", "Updates are easy: change one row", "Less storage"],
    cons: ["To see the full picture you must combine tables (joins), which gets slow on huge data or across many servers"],
    remember: "Store once, link by ID.",
    sources: [link("GeeksforGeeks: Normal forms in DBMS", "https://www.geeksforgeeks.org/dbms/normal-forms-in-dbms/"), link("Wikipedia: Database normalization", "https://en.wikipedia.org/wiki/Database_normalization")]
  },
  {
    id: "joins",
    title: "Joins",
    aliases: ["join", "sql join"],
    level: 2,
    concern: "data",
    kind: "idea",
    prereqs: ["normalization"],
    short: "Combining rows from two tables using a shared ID.",
    what: "A JOIN is a SQL operation that glues tables together. 'Show each order with the customer's name' = join Orders with Customers on customer_id.",
    example: "To print a report card you look up the roll number in the Students sheet to get the name, then in the Marks sheet to get the marks, and put them side by side. That look-up-and-combine is a join.",
    why: "Joins are what make normalized data usable. But they are expensive on big data, and when tables live on **different servers** (sharding) they become very hard. That's why big systems denormalize, or do the join in application code.",
    remember: "Joins are the price you pay for normalization.",
    sources: [link("SQLBolt: Queries with JOINs (practice)", "https://sqlbolt.com/lesson/select_queries_with_joins"), link("Visual explanation of SQL joins", "https://joins.spathon.com/")]
  },
  {
    id: "denormalization",
    title: "Denormalization",
    aliases: ["denormalize", "duplicate data"],
    level: 2,
    concern: "data",
    kind: "technique",
    prereqs: ["normalization", "joins"],
    short: "Deliberately copy data to avoid joins and make reads faster.",
    what: "Denormalization is the opposite of normalization: you **store some data redundantly**, for example putting the author's name and photo inside each post, so everything can be read in one go without joins.",
    example: "A restaurant prints the full menu on every table instead of keeping one menu at the counter. Ordering is faster for everyone, but when prices change they must reprint every table's menu.",
    why: "When reads happen far more often than writes (you read Instagram posts thousands of times more often than you change your name), it's worth paying the update cost to make reads fast. The article's advice: avoid joins in the database, and denormalize or join in your app code instead.",
    pros: ["Very fast reads: one lookup", "Easier to split across servers (no cross-server joins)"],
    cons: ["Redundant data takes more space", "Updates must change many copies, and missing one causes inconsistency"],
    remember: "Copy to read fast; pay for it when you update.",
    sources: [PRIMER("denormalization", "Denormalization"), link("Wikipedia: Denormalization", "https://en.wikipedia.org/wiki/Denormalization")]
  },
  {
    id: "nosql",
    title: "NoSQL",
    aliases: ["mongodb", "cassandra", "dynamodb", "document database", "key value"],
    level: 2,
    concern: "data",
    kind: "idea",
    prereqs: ["redundancy", "denormalization", "horizontal-scaling"],
    short: "Databases that drop strict tables and joins so they can scale out easily.",
    what: "NoSQL databases (MongoDB, Cassandra, DynamoDB, Redis) store data as **documents, key-value pairs, columns or graphs** instead of strictly linked tables. They usually avoid joins and are built to be spread across many machines.",
    example: "A SQL database is a strict library where each book card points to a separate author card. A NoSQL document database is like giving each person one complete file folder with everything about them inside, even if some of that info is also in someone else's folder.",
    why: "Because there are no joins, related data is often **copied inside each document** (denormalization). That's exactly why NoSQL is said to have 'high redundancy': it accepts extra copies in exchange for fast reads and easy horizontal scaling.",
    pros: [
      "Scales horizontally more easily",
      "Flexible structure: each document can have different fields",
      "Fast reads for data that is used together"
    ],
    cons: [
      "Redundant data, so one update may touch many places",
      "Many NoSQL databases give weaker guarantees (data can be briefly out of date)",
      "Complex queries and joins are hard"
    ],
    remember: "No joins → copy data → high redundancy → easy to scale.",
    sources: [link("MongoDB: NoSQL explained", "https://www.mongodb.com/resources/basics/databases/nosql-explained"), PRIMER("sql-or-nosql", "SQL or NoSQL?")]
  },
  {
    id: "replication",
    title: "Replication (Master–Slave)",
    aliases: ["master slave", "primary replica", "read replica", "replica"],
    level: 2,
    concern: "data",
    kind: "technique",
    prereqs: ["database", "redundancy"],
    short: "Keep copies of the database on several servers: one takes writes, the others serve reads.",
    what: "In master–slave (also called primary–replica) replication, **all writes** (insert/update/delete) go to the master. The master sends every change to one or more slaves, which keep identical copies. **Reads** can go to any slave.",
    example: "The teacher writes on the main whiteboard (master). Students in each row copy it into their notebooks (slaves). Anyone can read the notes from any notebook, but only the teacher writes new content.",
    why: "Most apps read far more than they write. Read replicas spread that read load, and a replica can be promoted to master if the master dies.",
    pros: ["Spreads read traffic", "Backup copies survive a server failure"],
    cons: [
      "Writes are still limited to one master",
      "Replication lag: a slave may be a little behind, so you might not see your own update straight away",
      "If the master dies, a slave must be promoted (failover)"
    ],
    remember: "One writer, many readers.",
    sources: [PRIMER("master-slave-replication", "Master-slave replication"), link("Wikipedia: Replication (computing)", "https://en.wikipedia.org/wiki/Replication_(computing)")]
  },
  {
    id: "master-master",
    title: "Master–Master Replication",
    aliases: ["multi master", "active active database"],
    level: 3,
    concern: "data",
    kind: "technique",
    prereqs: ["replication"],
    short: "Two databases that both accept writes and copy changes to each other.",
    what: "In master–master replication, two (or more) servers **both accept writes** and sync with each other. If one dies, the other keeps taking writes.",
    example: "Two branches of a shop each record sales in their own register and call each other every minute to sync stock. Either shop can sell, but if both sell the last item at the same moment, there's a conflict.",
    pros: ["No single point of failure for writes"],
    cons: ["Conflicts when the same data is changed on both at once", "More complex to set up and run"],
    remember: "Two writers that keep each other in sync. Watch for conflicts.",
    sources: [PRIMER("master-master-replication", "Master-master replication")]
  },
  {
    id: "sharding",
    title: "Sharding (Partitioning)",
    aliases: ["partitioning", "shard", "shard key"],
    level: 2,
    concern: "data",
    kind: "technique",
    prereqs: ["database", "joins", "horizontal-scaling"],
    short: "Split the data across several databases so each one holds only a part.",
    what: "Sharding splits one big dataset into pieces (**shards**) stored on different servers. A rule decides where each row lives: users A–M on server 1 and N–Z on server 2, or by hashing the user ID.",
    example: "In exam halls, roll numbers 1–100 sit in Room A and 101–200 in Room B. To find a student, check the roll number and go to the right room. No single room has to fit everyone.",
    details: [
      "Early Facebook was partitioned by college (harvard.thefacebook.com, mit.thefacebook.com…), a natural shard key",
      "Choose a shard key that spreads data and traffic evenly"
    ],
    pros: ["Both reads **and** writes scale, since each shard handles its own part", "Each database stays small and fast"],
    cons: [
      "Queries across shards (joins, totals) are hard",
      "A bad shard key makes one shard 'hot' (overloaded)",
      "Moving data when you add shards (resharding) is painful"
    ],
    remember: "Split data by a key; each server owns a slice.",
    sources: [link("DigitalOcean: Understanding database sharding", "https://www.digitalocean.com/community/tutorials/understanding-database-sharding"), PRIMER("sharding", "Sharding")]
  },

  {
    id: "cache",
    title: "Cache",
    aliases: ["caching", "cache hit", "cache miss"],
    level: 1,
    concern: "fast",
    kind: "technique",
    prereqs: ["database"],
    short: "Keep often-used answers in fast memory so you don't fetch or compute them again.",
    what: [
      "A cache is a small, very fast storage (usually RAM) that holds copies of data that is expensive to get.",
      "Before going to the slow database, the app checks the cache. Found = **cache hit** (fast). Not found = **cache miss**: fetch from the database, then save it in the cache for next time."
    ],
    example: "You keep your most-used books on your study table instead of walking to the library each time. The table is the cache; the library is the database. The table is small, so you only keep what you use often.",
    why: "Reading from RAM is far faster than a database query. Caching can make apps many times faster and takes huge load off the database.",
    pros: ["Much faster responses", "Less load on the database"],
    cons: [
      "Cached data can become stale (old)",
      "Limited size, so you must decide what to throw out (e.g. least recently used)",
      "Another system to run"
    ],
    remember: "Check the cache first; go to the database only on a miss.",
    sources: [link("Cloudflare: What is caching?", "https://www.cloudflare.com/learning/cdn/what-is-caching/"), link("AWS: Caching overview", "https://aws.amazon.com/caching/")]
  },
  {
    id: "query-caching",
    title: "Caching Database Queries",
    aliases: ["query cache", "mysql query cache"],
    level: 2,
    concern: "fast",
    kind: "technique",
    prereqs: ["cache"],
    short: "Store the result of a SQL query, using the query text as the key.",
    what: "Use the SQL query (or a hash of it) as the key and store its result in the cache. The next time the exact same query runs, return the saved result.",
    example: "You write down the answer to 'What is 347 × 29?' in your notebook. Next time someone asks exactly that, you just look it up. But if one of the numbers changes, which of your saved answers are now wrong?",
    cons: [
      "Hard to expire: when one row changes, you don't know which cached queries included it",
      "Slightly different queries are cached separately"
    ],
    remember: "Easy to add, hard to keep correct. Prefer object caching.",
    sources: [PRIMER("caching-at-the-database-query-level", "Caching at the database query level"), CACHE]
  },
  {
    id: "object-caching",
    title: "Caching Objects",
    aliases: ["object cache"],
    level: 2,
    concern: "fast",
    kind: "technique",
    prereqs: ["query-caching"],
    short: "Cache the finished object your code uses (like a full user profile), not raw query results.",
    what: "Your app builds an object, say a User with profile, friends and settings, from several queries. Cache that whole ready-to-use object under a key like 'user:42'. When the user changes, just delete 'user:42'.",
    example: "Instead of saving answers to random maths questions, you keep a ready-made 'profile card' for each friend. When a friend changes their phone number, you rewrite only that one card.",
    why: "The article recommends this over query caching: it's easy to invalidate, and objects can be built in the background.",
    pros: ["Easy to invalidate: delete one key", "Saves both database work and assembly work"],
    remember: "Cache whole objects; delete the key when they change.",
    sources: [PRIMER("caching-at-the-object-level", "Caching at the object level"), CACHE]
  },
  {
    id: "cache-invalidation",
    title: "Cache Invalidation",
    aliases: ["ttl", "stale data", "expiry", "expire"],
    level: 3,
    concern: "fast",
    kind: "problem",
    prereqs: ["cache"],
    short: "Removing or updating cached data when the original changes.",
    what: "When data in the database changes, the cached copy is now wrong (**stale**). Invalidation means deleting or updating it. Common ways: give each entry an expiry time (**TTL**), delete the key on every update, or update the cache at the same time as the database.",
    example: "The canteen's 'Today's special' board. If the special changes and nobody updates the board, students order something that isn't there. Either someone wipes the board at every change, or it's reset every morning (a TTL).",
    remember: "'There are only two hard things in computer science: cache invalidation and naming things.'",
    sources: [PRIMER("when-to-update-the-cache", "When to update the cache"), link("AWS: Caching best practices", "https://aws.amazon.com/caching/best-practices/")]
  },

  {
    id: "in-memory-store",
    title: "Redis & Memcached",
    aliases: ["redis", "memcached", "in-memory", "key value store"],
    level: 3,
    concern: "fast",
    kind: "tool",
    prereqs: ["cache"],
    short: "The popular in-memory stores used for caches and sessions.",
    what: "Memcached and Redis are servers that store **key → value** data entirely in RAM, so lookups are extremely fast. Memcached is a simple cache. Redis also has data structures (lists, sets, sorted sets), can save to disk and can replicate, so it's also used for sessions and queues.",
    example: "A huge, super-fast notice board everyone in the office can read and stick notes on: 'user:42 → {name, photo}'.",
    remember: "Memcached = simple cache. Redis = cache + extras.",
    sources: [link("Redis docs: Get started", "https://redis.io/docs/latest/get-started/"), link("Memcached: About", "https://memcached.org/about")]
  },
  {
    id: "asynchronism",
    title: "Asynchronism",
    aliases: ["async", "background jobs", "asynchronous"],
    level: 1,
    concern: "async",
    kind: "principle",
    prereqs: ["server"],
    short: "Don't make the user wait for slow work: do it in advance, or in the background.",
    what: "Asynchronism means slow tasks don't block the user's request. Either the work is **done ahead of time** (precomputing), or it's **handed to background workers** and the user is told 'we're working on it'.",
    example: [
      "The article's bakery: you want bread.",
      "**Way 1**: the bakery bakes popular breads early in the morning, so they're ready when you walk in (precomputing).",
      "**Way 2**: for a custom birthday cake, they take your order, say 'come back at 5 pm' and bake it in the back while serving other customers (background jobs with a queue)."
    ],
    why: "If a request takes 30 seconds (processing a video, sending 1000 emails, building a report), the user waits and a server is tied up. Async keeps the app responsive.",
    remember: "Do it before, or do it later. Just not while the user waits.",
    sources: [ASYNC, PRIMER("asynchronism", "Asynchronism")]
  },
  {
    id: "precomputing",
    title: "Precomputing (Pre-baking)",
    aliases: ["static html", "pre-render", "prebake"],
    level: 2,
    concern: "async",
    kind: "technique",
    prereqs: ["asynchronism", "cache"],
    short: "Do the heavy work in advance and serve the ready-made result.",
    what: "Generate pages or results **ahead of time**, for example turning dynamic pages into static HTML files every hour, and serve those files directly. Serving a ready file is extremely fast.",
    example: "The canteen fries 200 samosas before the lunch break instead of frying each one when someone orders.",
    details: ["Craigslist famously served many pages as pre-generated static .html files"],
    pros: ["Extremely fast to serve", "Almost no load per request"],
    cons: [
      "Results can be slightly out of date until the next run",
      "Changing the page design means regenerating everything"
    ],
    remember: "Cook before the rush.",
    sources: [link("Cloudflare: What is a static site generator?", "https://www.cloudflare.com/learning/performance/static-site-generator/")]
  },
  {
    id: "message-queue",
    title: "Message Queue",
    aliases: ["queue", "rabbitmq", "kafka", "sqs", "workers", "job queue"],
    level: 2,
    concern: "async",
    kind: "tool",
    prereqs: ["asynchronism"],
    short: "A to-do list between your app and background workers.",
    what: "A message queue (RabbitMQ, Kafka, AWS SQS) holds jobs. The web server quickly drops a job into the queue ('resize this photo') and replies to the user right away. **Worker** machines pick jobs from the queue and do them. When the job is done, the user is notified.",
    example: "At a busy café, the cashier writes your order on a slip and puts it on the rail. Baristas pick up slips one by one. The cashier keeps taking new orders without waiting for each coffee to be made.",
    pros: [
      "The user gets a fast response",
      "Workers can be scaled separately from web servers",
      "Traffic spikes are absorbed: jobs wait in line instead of crashing the server"
    ],
    cons: ["The result isn't immediate", "Failed jobs need retries", "One more system to run"],
    remember: "Web server takes orders, workers cook.",
    sources: [link("AWS: What is a message queue?", "https://aws.amazon.com/message-queue/"), link("CloudAMQP: RabbitMQ for beginners", "https://www.cloudamqp.com/blog/part1-rabbitmq-for-beginners-what-is-rabbitmq/")]
  }
];

// Pairs that look alike but mean different things (shown as "Don't confuse with").
const confusions = [
  {
    a: "vertical-scaling",
    b: "horizontal-scaling",
    note: "**Vertical** = one bigger machine. **Horizontal** = more machines sharing the work."
  },
  {
    a: "scalability",
    b: "high-availability",
    note: "**Scalability** = handling more users. **High availability** = staying up when parts fail. A system can have one without the other."
  },
  {
    a: "redundancy",
    b: "replication",
    note: "**Redundancy** is the general idea of keeping extra copies. **Replication** is one specific way of doing it for databases."
  },
  {
    a: "normalization",
    b: "denormalization",
    note: "**Normalization** removes copies so each fact lives in one place. **Denormalization** adds copies back on purpose, for faster reads."
  },
  {
    a: "replication",
    b: "sharding",
    note: "**Replication** copies the same data to many servers. **Sharding** splits different data across servers."
  },
  {
    a: "query-caching",
    b: "object-caching",
    note: "**Query caching** saves raw query results. **Object caching** saves the finished object your code uses."
  },
  {
    a: "sticky-sessions",
    b: "central-session-store",
    note: "Both stop users getting logged out. **Sticky sessions** pin each user to one server; a **central session store** lets any server serve anyone."
  }
];

// Related concepts. Read each edge as: "<from> <label> <to>"
const edges = [
  { from: "scalability", to: "vertical-scaling", label: "achieved by" },
  { from: "scalability", to: "horizontal-scaling", label: "achieved by" },
  { from: "scalability", to: "cache", label: "is helped by" },
  { from: "scalability", to: "asynchronism", label: "is helped by" },
  { from: "database", to: "scalability", label: "is often the bottleneck for" },

  { from: "vertical-scaling", to: "server", label: "upgrades one" },
  { from: "vertical-scaling", to: "single-point-of-failure", label: "still has a" },
  { from: "horizontal-scaling", to: "server", label: "adds more" },
  { from: "horizontal-scaling", to: "load-balancer", label: "needs a" },
  { from: "horizontal-scaling", to: "stateless-server", label: "needs" },
  { from: "horizontal-scaling", to: "redundancy", label: "gives you" },

  { from: "server", to: "session", label: "remembers users with a" },
  { from: "session", to: "sticky-sessions", label: "if kept on one server, needs" },
  { from: "sticky-sessions", to: "central-session-store", label: "is better replaced by a" },
  { from: "stateless-server", to: "central-session-store", label: "keeps sessions in a" },
  { from: "stateless-server", to: "shared-storage", label: "keeps files in" },
  { from: "stateless-server", to: "deployment-consistency", label: "requires" },
  { from: "central-session-store", to: "in-memory-store", label: "usually runs on" },

  { from: "load-balancer", to: "dns-round-robin", label: "simplest form is" },
  { from: "load-balancer", to: "sticky-sessions", label: "can do" },
  { from: "load-balancer", to: "single-point-of-failure", label: "can itself be a" },
  { from: "firewall", to: "load-balancer", label: "exposes only the" },
  { from: "firewall", to: "database", label: "hides the" },

  { from: "single-point-of-failure", to: "high-availability", label: "is fixed by" },
  { from: "high-availability", to: "redundancy", label: "is built with" },
  { from: "redundancy", to: "raid", label: "for disks is" },
  { from: "redundancy", to: "replication", label: "for databases is" },
  { from: "shared-storage", to: "raid", label: "often uses" },

  { from: "database", to: "normalization", label: "is designed with" },
  { from: "normalization", to: "redundancy", label: "removes" },
  { from: "normalization", to: "joins", label: "needs" },
  { from: "denormalization", to: "redundancy", label: "adds back" },
  { from: "denormalization", to: "joins", label: "avoids" },
  { from: "joins", to: "sharding", label: "become hard with" },
  { from: "nosql", to: "denormalization", label: "relies on" },
  { from: "nosql", to: "database", label: "is an alternative to" },
  { from: "nosql", to: "horizontal-scaling", label: "is built for" },
  { from: "database", to: "replication", label: "is scaled by" },
  { from: "database", to: "sharding", label: "is scaled by" },
  { from: "replication", to: "master-master", label: "has a variant:" },

  { from: "cache", to: "database", label: "reduces load on the" },
  { from: "cache", to: "in-memory-store", label: "usually runs on" },
  { from: "cache", to: "query-caching", label: "can store" },
  { from: "cache", to: "object-caching", label: "can store" },
  { from: "cache", to: "cache-invalidation", label: "needs" },
  { from: "query-caching", to: "cache-invalidation", label: "struggles with" },
  { from: "object-caching", to: "cache-invalidation", label: "simplifies" },

  { from: "asynchronism", to: "precomputing", label: "way 1:" },
  { from: "asynchronism", to: "message-queue", label: "way 2:" },
  { from: "precomputing", to: "cache", label: "is similar to a" },
  { from: "message-queue", to: "in-memory-store", label: "can run on" }
];

export default { nodes, edges, confusions };
