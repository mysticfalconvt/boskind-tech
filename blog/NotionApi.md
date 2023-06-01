---
title: Using the new Notion API with Gatsby.JS
date: 2021-06-04
---

![](data:image/svg+xml;charset=utf-8,%3Csvg height='459.00000000000006' width='977' xmlns='http://www.w3.org/2000/svg' version='1.1'%3E%3C/svg%3E)

![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAJCAYAAAAywQxIAAAACXBIWXMAAAsSAAALEgHS3X78AAABzklEQVQoz31Sy07bUBT0nxakwgfAEjZQkHiplEeXhSrimba7FlpwHjSpklAeQYIggkkINoakhMQmwSY2mZ5zJKOoiy5G5/hen7kzd67SfvbQiWe/Jfh3PQDaPnzvCfVaFbX7O3gtV9aCPaXxYKF8a+LGNASGXsJV6VKqea3DNHTcV/+8DDJaT46QMbgPCBnKtXGF3UwaicQOEj/jiEZURNRtqttIxmM43E1DvyzAdZovg0zSbNgC7gN1HYQp7MSjiEVVqOoWYrEI4oRMMoHS2SlsUsI2+SrYUaV8K+rZUaV8A9uqyb5YtuhDJ3sXF+fQtDy08zMUqC8WNBilIupsl1TwAA9nswdIkpuNja/Y3PwmQnK5Y1ErhI5dR41OqxKpdVeR0x5ozbYIVPlHj8jYcvZwH+HwGr58DiMU+ojFhQ/Uf0ImnZKQhNAtm7CODmBl9+BSOD6rIWusKADfjfPYQCr1C/Nzs5ianMDo6AjGx8fwfn4OqyvLyNPVcHCKR8xuUYNbyMOnvk1kQZqdz4EJ935nMEEkvT2v0d31Cv39fRgcHMCb4SEJ1HlsQmGCNqtg/Of98ekcwtaP75ideYfp6bdYWgohvL4myJ0cS+J/AcMXiywFDAjmAAAAAElFTkSuQmCC)![](https://cdn.sanity.io/images/jzq9n05y/production/5b9369a5b9e1d67c3a1e6fbe864bfcda7827f69d-977x459.png?w=977&h=459&auto=format)

## Using the new Notion API with Gatsby.JS

Notion released a nice official API a few weeks ago. I finally got around to giving it a try and I was impressed with how quickly I could get something up and running, and I did it all on my lunch break. Here is the super quick, also done in the same lunch break description.

To skip ahead: Check out the ​ [final version right here](/bookReviews)

I am just adding this to an existing Gatsby JS project, so if you want to do this from scratch... start out with a new Gatsby site. Then install Gatsby Source Sanity

`npm install gatsby-source-sanity`

Then you need to get some info from your Notion account => Settings => Integration and create a new integration.

![](https://cdn.sanity.io/images/jzq9n05y/production/c8ca5974c2889c37203a003484ae399b7248431b-1068x527.png?w=600)

Then create a new integration, choose the workspace you want, and get that all-important secret token

![](https://cdn.sanity.io/images/jzq9n05y/production/9caada205a665bea7980c58a5c204bf6b549988c-537x212.png?w=600)

Now we need to go into our gatsby-config.js and add in a new plugin

`{`

`` resolve:`gatsby-source-notion-api`, ``

`options:{`

`token:process.env.NOTION_TOKEN,`

`databaseId:process.env.NOTION_ID,`

`},`

`},`

Add this in and put the Token into your .env file. You can just put it directly here, but don't do that. Don't be that person who accidentally puts their secrets into a public repo.

Next, as you probably noticed from what we had above... we need the ID of the database that you need. If you go to the database that you want to use it is what you will see between the notion.so/ and the ?

Now you need to share the database with that integration that you created. Go to the database that you would like to share and click share then chose the correct integration.

![](https://cdn.sanity.io/images/jzq9n05y/production/0907f038439dbf63882c8f7fabe2583cc34f84b0-476x249.png?w=600)

Now give this a nice little npm run dev and away we go. You should see all of your notion database showing up in the gatsby QraphQL playground. I quickly built a GraphQL query for the books in the database where I track what I am reading.

![](https://cdn.sanity.io/images/jzq9n05y/production/c2043e17686294d2c399b0a80f1505ec9d216a6f-984x421.png?w=600)

Now I quickly threw all that data onto a page for a quick view on my website of the books I have finished recently.

![](https://cdn.sanity.io/images/jzq9n05y/production/bb8154d282544bae7e987ee9ab8c2362de9cf865-646x413.png?w=600)

Check out the ​ [final version right here](/bookReviews)

One of the easiest ways I have seen yet to source data easily. And since I am using Notion already, I am sure I can find a ton of uses for this.

![](data:image/svg+xml;charset=utf-8,%3Csvg height='720' width='720' xmlns='http://www.w3.org/2000/svg' version='1.1'%3E%3C/svg%3E)

![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAsSAAALEgHS3X78AAAFK0lEQVQ4yyWT21OaWRbFv9dEBUEjaqvRRGOrUYm2pjVB8ILcQa5y+QC5iIICmigKGPGaqEklY9LpZGqqK9PpTlX3VM3bVM3TPM38X785nX5YVafOqb3OWmvvLb1J2XiXtPA3WccngZ/jJj7nw/x6XOSXq10+nmS4KCxyEBtkx9/FpruT3PIw66FRVtztRB2NRGzNRM0a1uZVSJeynpfhx7wLTHLt+47r4CM+5QP840WJz2ebvCmYOIwOsee/TdHVRtLcQmixjYCAd0GNd15JcE5FzNBMQqdEunBrqS1pObOP8Nw6wJV9kPeRx/xU8PBj1sx5aJCqt4c9Tw95exvRBRV+gxKPoRHPfDM+YwtBo4bwQgf+uQ6kH2zDHNpG2LEMUTX3cW69w0vvfd7nnHx4EuYyOcup/EhAx65vgJS1BdnYSNjUTMTeSdTVg+zoJuzsxWe/h/TGMkrFOkzG2seGrZuKs5vz5ftcl1L88Oqa81KJWiLIkWynHJkmK9TGzSriJhUrVg0xayuyRUPI0obP1Ip0YB6iaPuWqLWbqO0O60t9PBGh156ucvbmN7bL75E9sig0k4+62EjME/f0E7e2Ebe0EDWpSSyqviI8p0DKmO6RtN1Ftt9Bdg0g+0ZIhSbZ3yty9vafZLZfY5hxoJ+aJ5ba4kntgs2tDJmonqQgTtrayJmayInmyLqbSIG5LvzGTsJCYcTVR8g7QEL+nmfVAq9ef6SwUca16MRmdJHKP+for//h9O0X9nfz5OJ6EiKiFdGoiF6B65HoskffinOuFZ+5i5DzLgGXULuspbwT5fVplcONdbZiEYqJFNXKK979+l8+/v4//vLjZ44qm2RCDwiI7LymTvz2fiSnoQX7/C1cpnZxcRe/q59Y8DuqWyFelLKUEj62BZ6uJjh6WubDu7/z6cu/+enLv7h+dU5p3UTc/4Cof5KMPIVk1qlZ0DVi1DdhN91m2TPKZmKWas5NNuwgYNWxElgg6rUg26xU02muDg45PqhR2Uqwt25hZ93B9qqT4ooeaVH4nptWYjLcEnb7ySVmqBac5KJGjLpxzPox0iEDce8MTv1D1lxWCmE/QbtZfPZYRGHmxV6S53urHBR9SGG36Kx3kLSspbRp4GJ/SVgVBc4ZRga/ZVE/zpM1C+VNO5llI+klK8umBQwTY+gnRljxzlIryJztrHL5bBXppBrheN/HWdnD61qAj2cxrvZDOBcf0Xunl4mxYWT/LPmURczfLObpSb4fGWakr5fxgT6C5inKKRdHuSAXO3Gkl8cZXpTDXO0FeFsJ8eEwJh5CeC0zXwm7unoYGuhnQnsf7dAAPR23+UbTzjctGvpvd+BbeMhB2sXznI+LDWH5ZNvHaUFcFBxcbru53A1ysisTDZq5P9TPrVutNKk1NDe1CrShVmloVDahbGiks7UFh/4Be3ELR2kbx0kTUjVt5XDVLLBIJW1mN+sVm5AmsuJHNzVKR5sGhUJFQ4MKpUL9lUwhzvU3G+hp1+DWayn4Z9jy6Si6p5Ge5QJUM0ti3qw8jYl9TbhJZNNEk7IY9seM3usWJI3U1TVQX6+goV5JQ50ClULJg95OInNjZB1TrFkmSBnHkM4qOWo7aSqFGPu5sJipMBtrK2QTYRKeRaa1A8Kmmps36qm7Wf9V2R+E7c1NzI70kVyYIGt5yLpxnMzcKNLpQZGTap5aeYOD0hr7WymK6Qj5eID0soPp8VHUjWpu3Kij7safhAqhskdEYZsYJGOaJGsWEITZeS3/B64YBn4Ij3kVAAAAAElFTkSuQmCC)![](https://cdn.sanity.io/images/jzq9n05y/production/4552e6f0e67b8a97fdd7e4591ea9d9ce34cbb5c2-720x720.png?w=720&h=720&auto=format)

## Post by: Rob Boskind

8th Grade Math Teacher

Code Junkey

Father of all girls

Find me on Twitter [@RobBoskind](https://twitter.com/RobBoskind)​
