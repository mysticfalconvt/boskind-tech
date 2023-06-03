---
title: NCUJHS Tech Dashboard V2
date: 2021-03-28
---

![](https://cdn.sanity.io/images/jzq9n05y/production/04aa9e8d6126b1b5a8619956b248dec4b14d72ea-2992x1344.png?w=2992&h=1344&auto=format)

## School Dashboard Mk II

So... I just wrote a giant blog post on my [school dashboard](https://boskind.tech/blog/ncujhs-tech-guided-tour) that we are using in school so I thought I would add a quick little post about the new version. School Dashboard MKII.

**_Tech Stack:_** The primary reason I wanted to recreate something that had been such a large undertaking to create in the first place is to update the tech stack. Some of the things I had done can be improved now that I better understand the user interactions to smooth out the user experience.

**_React & NEXT JS:_** Using React lets me make user interactions so much better. I really love the React functional component workflow, and how it makes it easier to build better interactions with the user. I also love how easy it is to pop in a quick form onto the page without a trip to the server for things like opening a form for a new calendar event.

![](https://cdn.sanity.io/images/jzq9n05y/production/0242d01d7f61848a498963a18b64b1ac3bb10e2d-2972x1316.png?w=600)

One nice improvement is using React-Table [(thanks TanStack)](https://tanstack.com/) for the wonderful work you do. I love the quick easy to layout tables with quick updating for filters, searches, and sorts. This is a huge improvement over the old versions SSR with no interactivity. Before everything was done on the server so sorting by column required a new request and a new page to view.

![](https://cdn.sanity.io/images/jzq9n05y/production/be8d7734cda645826bdd798b6d91bb82e7241056-1338x846.png?w=600)

The next piece I like is using DownshiftJS for a great search bar. It even has things like added buttons to go with specific categories of users.

![](https://cdn.sanity.io/images/jzq9n05y/production/c5de658fded468530377f4915baf67bc772a14c1-2552x498.png?w=600)

The next big wonderful piece is **_React Query_**. This is just a wonderful bit of code. [(thanks TanStack)](https://tanstack.com/) ... Again. Things like refetching queries when you go back to the tab are like magic. One of the biggest issues with the previous dashboard was students who would purposefully leave an old tab open without refreshing so that data was old and they could say they had no old work to do.

**_KeystoneJS and Graphql:_** Coming from a serverside Node app to fetching data was a bit of a learning curve, but Graphql is like magic for easy to use queries. Keystone Schemas work with MongoDB to create an easy peasy data pipeline that is incredibly powerful with some custom mutations. Fun to write and I feel like a superhero with the amount of code needed to do some really cool things. And the Keystone CMS portal is so much easier to use to tweak data while testing and setting things up than even the super handy MongoDB Compass.

This is very much still a work in progress, so I haven't got it live anywhere yet, but if you feel like taking a look at some code check out ​​ [the GitHub repo.](https://github.com/mysticfalconvt/SchoolDashboard)
