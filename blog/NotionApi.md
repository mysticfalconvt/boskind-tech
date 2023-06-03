---
title: Using the new Notion API with Gatsby.JS
date: 2021-06-04
description: Quick and dirty intro to using the notion API with Gatsby.JS.  Written in a lunch break.
---

![](https://cdn.sanity.io/images/jzq9n05y/production/5b9369a5b9e1d67c3a1e6fbe864bfcda7827f69d-977x459.png?w=977&h=459&auto=format)

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

```

    {

        resolve:`gatsby-source-notion-api`,

        options:{

            token:process.env.NOTION_TOKEN,

            databaseId:process.env.NOTION_ID,

        },

    },
```

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
