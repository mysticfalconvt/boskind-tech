---
title: NCUJHS Tech Dashboard V2
date: 2021-03-28
---

![](data:image/svg+xml;charset=utf-8,%3Csvg height='1344' width='2992' xmlns='http://www.w3.org/2000/svg' version='1.1'%3E%3C/svg%3E)

![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAJCAYAAAAywQxIAAAACXBIWXMAAAsSAAALEgHS3X78AAACcUlEQVQoz22PV0+TARSG+3eMmnBBotFgHCGQoCwpFmS1TFEUR5QyKtQGCbKixAEOIsEgAsZCwghqNSiQCC1lFctGMCDQUkbX9/XxA2+9eHLyXrzPOUcmz29AWdxCsqaOmFQdEeevERaaSWR4JtFh6ShClCiC4lCciSb2ZATxAWdJOBZE4pHTKP0DUPkdJeWwP2kH/cg4cAhZkq6JrJJGrmuekZFWgEJ+lXMxakKTtEQpC5HH5yJX3EQelYUi8hKxYSlcDEkkLjiWhEA5iafCSToRQnJAMKnHA5Hde9FJSa2e8sdNlJW/RFtcQ86DN9ypfEdOeSM5pfWo779CraslV/uE/MJq8gsqKcgrQ6Mu4e5tHYW3iii6oUGbnYes3zxFh2GQ990DdPWaMfyY5LNxGsPwLP1jcwxNzGEcn8U4No1pbArTqBXTyE+M5klMwxOYTOMSYwwbRzEbR5CtrPyhvd1A1dNmHjX08Lx9kNoeC/V9v/g+s8my3YV914vNKbC67WV1y41NypsuEccebpEtCZdXRBBFZEvzi9RU1KCKzeZCQh7RWZVE5LwmrryLCr2ZXvM8C6sOZtecfBldwjA0zcyyjQ2niM3lwy7hcPtwCj5EH8h+z81TV1LF5bB4VJGpqJRq4q+Ukl5UT/Xbr/QNTbK8asMqSVp7hmjRf8E6tci2W2DH62PHI8mk6dkX+pDZ1tbpaG6jWltG/cNa2pr06D/00PlxgBHLPOs2B7suDxuOXSzWBSzjU2ys2yWBiEdkX+SVThMkmW9PaN928umbmdaWbiyjFna3d3C53LjdHgSpJH2xz972vSwIAqL4r/w//gKx5iv5K0s27wAAAABJRU5ErkJggg==)![](https://cdn.sanity.io/images/jzq9n05y/production/04aa9e8d6126b1b5a8619956b248dec4b14d72ea-2992x1344.png?w=2992&h=1344&auto=format)

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

![](data:image/svg+xml;charset=utf-8,%3Csvg height='720' width='720' xmlns='http://www.w3.org/2000/svg' version='1.1'%3E%3C/svg%3E)

![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAsSAAALEgHS3X78AAAFK0lEQVQ4yyWT21OaWRbFv9dEBUEjaqvRRGOrUYm2pjVB8ILcQa5y+QC5iIICmigKGPGaqEklY9LpZGqqK9PpTlX3VM3bVM3TPM38X785nX5YVafOqb3OWmvvLb1J2XiXtPA3WccngZ/jJj7nw/x6XOSXq10+nmS4KCxyEBtkx9/FpruT3PIw66FRVtztRB2NRGzNRM0a1uZVSJeynpfhx7wLTHLt+47r4CM+5QP840WJz2ebvCmYOIwOsee/TdHVRtLcQmixjYCAd0GNd15JcE5FzNBMQqdEunBrqS1pObOP8Nw6wJV9kPeRx/xU8PBj1sx5aJCqt4c9Tw95exvRBRV+gxKPoRHPfDM+YwtBo4bwQgf+uQ6kH2zDHNpG2LEMUTX3cW69w0vvfd7nnHx4EuYyOcup/EhAx65vgJS1BdnYSNjUTMTeSdTVg+zoJuzsxWe/h/TGMkrFOkzG2seGrZuKs5vz5ftcl1L88Oqa81KJWiLIkWynHJkmK9TGzSriJhUrVg0xayuyRUPI0obP1Ip0YB6iaPuWqLWbqO0O60t9PBGh156ucvbmN7bL75E9sig0k4+62EjME/f0E7e2Ebe0EDWpSSyqviI8p0DKmO6RtN1Ftt9Bdg0g+0ZIhSbZ3yty9vafZLZfY5hxoJ+aJ5ba4kntgs2tDJmonqQgTtrayJmayInmyLqbSIG5LvzGTsJCYcTVR8g7QEL+nmfVAq9ef6SwUca16MRmdJHKP+for//h9O0X9nfz5OJ6EiKiFdGoiF6B65HoskffinOuFZ+5i5DzLgGXULuspbwT5fVplcONdbZiEYqJFNXKK979+l8+/v4//vLjZ44qm2RCDwiI7LymTvz2fiSnoQX7/C1cpnZxcRe/q59Y8DuqWyFelLKUEj62BZ6uJjh6WubDu7/z6cu/+enLv7h+dU5p3UTc/4Cof5KMPIVk1qlZ0DVi1DdhN91m2TPKZmKWas5NNuwgYNWxElgg6rUg26xU02muDg45PqhR2Uqwt25hZ93B9qqT4ooeaVH4nptWYjLcEnb7ySVmqBac5KJGjLpxzPox0iEDce8MTv1D1lxWCmE/QbtZfPZYRGHmxV6S53urHBR9SGG36Kx3kLSspbRp4GJ/SVgVBc4ZRga/ZVE/zpM1C+VNO5llI+klK8umBQwTY+gnRljxzlIryJztrHL5bBXppBrheN/HWdnD61qAj2cxrvZDOBcf0Xunl4mxYWT/LPmURczfLObpSb4fGWakr5fxgT6C5inKKRdHuSAXO3Gkl8cZXpTDXO0FeFsJ8eEwJh5CeC0zXwm7unoYGuhnQnsf7dAAPR23+UbTzjctGvpvd+BbeMhB2sXznI+LDWH5ZNvHaUFcFBxcbru53A1ysisTDZq5P9TPrVutNKk1NDe1CrShVmloVDahbGiks7UFh/4Be3ELR2kbx0kTUjVt5XDVLLBIJW1mN+sVm5AmsuJHNzVKR5sGhUJFQ4MKpUL9lUwhzvU3G+hp1+DWayn4Z9jy6Si6p5Ge5QJUM0ti3qw8jYl9TbhJZNNEk7IY9seM3usWJI3U1TVQX6+goV5JQ50ClULJg95OInNjZB1TrFkmSBnHkM4qOWo7aSqFGPu5sJipMBtrK2QTYRKeRaa1A8Kmmps36qm7Wf9V2R+E7c1NzI70kVyYIGt5yLpxnMzcKNLpQZGTap5aeYOD0hr7WymK6Qj5eID0soPp8VHUjWpu3Kij7safhAqhskdEYZsYJGOaJGsWEITZeS3/B64YBn4Ij3kVAAAAAElFTkSuQmCC)![](https://cdn.sanity.io/images/jzq9n05y/production/4552e6f0e67b8a97fdd7e4591ea9d9ce34cbb5c2-720x720.png?w=720&h=720&auto=format)

## Post by: Rob Boskind

8th Grade Math Teacher

Code Junkey

Father of all girls

Find me on Twitter [@RobBoskind](https://twitter.com/RobBoskind)​
