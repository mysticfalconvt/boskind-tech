---
title: NCUJHS.Tech Guided Tour V1
date: 2021-03-26
description: A guided tour of the NCUJHS.Tech School Dashboard.  This is the initial version that was used for 2 years.  It was replaced by a new version in 2021.
---

![](https://cdn.sanity.io/images/jzq9n05y/production/81e4cfe7316d06836b73f8ca11dce04ae1f45d69-1401x866.png?w=1401&h=866&auto=format)

## NCUJHS.Tech Guided Tour

One of the things I am most proud of is my [NCUJHS school dashboard](https://school-dashboard-demo.herokuapp.com/). (Warning: This is a long post about a big App) I have been working on this for several years. This was built as a way for me to organize the giant **_Spreadsheet of Doom_** that had been growing and growing and becoming less and less user-friendly. It was used by all teachers for many purposes. There was a tab for coming events. Tabs for what TA (Teacher-Advisory or homeroom) students are in, Links to documents, Callback (Our late work tracking program), and many others.

Above is the teacher's homepage. It has a nav along the top, and a little window into how the school is doing for PBIS (Our Catch students being good program). The PBIS System at the school rewards students for good behavior by giving them a card that enters them in a drawing for rewards. This tracks how many teams are on the next reward level. It also has a line chart showing PBIS cards over time to highlight growth. Under that are some common links for teachers, such as giving a PBIS Card, putting in a discipline referral, or tracking student engagement for remote learning.

Below that is a spot where teachers enter their current class work. This allows all students in your class, and their other teachers, to see what they should be working on. Below is the important information for your day. It shows today's schedule, followed by a card for any events taking place today. After that are callback assignments for students in the teacher's guided study. If it was assigned by that teacher then it also has a button to mark it completed.

![](https://cdn.sanity.io/images/jzq9n05y/production/fe8e9a34139ea328eb4e3031984896902ca731af-1383x745.png?w=600)

The links and events pages are primarily for teachers and students to look up important info. The links page is filtered so teachers see links that are for teachers and students only see links that are for students. Because there are many items such as forms to fill out, there is a very handy search bar at the top.

![](https://cdn.sanity.io/images/jzq9n05y/production/29fe9f1735635d7a196a52ef9e0ad79216524cb0-1173x677.png?w=600)

The callback page is a common spot for teachers. When an assignment is overdue, teachers add them to Callback. Students get a daily reminder of assignments when they log in, and so does their Guided Study teacher. There is a place to add links to necessary websites or documents to complete the assignment. Parents also see these assignments when they log in, and there is an easy-to-click button to email parents about overdue work.

![](https://cdn.sanity.io/images/jzq9n05y/production/42a53f79222b22c71f0da721c70d411fe5f807b3-1228x990.png?w=600)

The TA Dashboard page is a useful spot for teachers who have a TA. It gives a quick info update at the top, with a button to quickly give a PBIS Card. Below are the overdue callback assignments for the students in the TA. Under that are details for each student (only 1 student is shown) You can get to a student's account by clicking on their name anywhere for more details. You can also see their schedule, as well as the current assignments for each of their classes.

![](https://cdn.sanity.io/images/jzq9n05y/production/d71fccde962fc69f48c0cd8ee594ea81827f355a-1394x686.png?w=600)

The finder page is used to find specific information about the student population as a whole or search for a specific student, using the search bar. This can be sorted by columns to quickly see things like students with the most callback assignments or Cellphone violations. Clicking on a **name** will bring you to a specific account for that student or teacher. Clicking on the **view teachers** button brings you to the list of teachers which includes teacher-oriented information, but is similar to the student view.

![](https://cdn.sanity.io/images/jzq9n05y/production/9da7267793e0bf32283ce516b39e5bf1ead9a140-1252x1108.png?w=600)

Going to an individual student account brings the user to see all the information about that specific student, as well as actions like **_signing up a parent account_** for the student or **_sending an automatically generated email_** to the parents about late work. The student's latest PBIS cards are also visible to see what other teachers are recognizing a student for.

![](https://cdn.sanity.io/images/jzq9n05y/production/b39754a873051673b171a55eb1d35ede9eaa857a-1224x505.png?w=600)

The PBIS team page shows info about PBIS teams as they work towards rewards. It also graphs the number of PBIS Cards given per week to spot trends.

![](https://cdn.sanity.io/images/jzq9n05y/production/58a2f1d6f239c36035fa5ea2bbd2279e6ea448a6-1216x264.png?w=600)

(here it is from an active school setting)

![](https://cdn.sanity.io/images/jzq9n05y/production/b1324616134385e2c98852fa3284d8b7328258d3-1397x391.png?w=600)

Student focus is where we log general student information. Parent contacts are logged in here as well as things like cell phone violations. For cell phone violations, administration gets an auto-generated email. If a teacher uses the automatic email a parent about late work button then an entry is automatically generated here.

![](https://cdn.sanity.io/images/jzq9n05y/production/6bb75771035648ff76708c34b00e031b600c7ef8-1380x1255.png?w=600)

Discipline Referrals show up as a list, including all for admin, but only those authored by the teacher for teachers. Administration is able to edit them with a separate field for their comments as well as a button that pulls up a version formatted to print nicely, and mail to the parents of offending students.

![](https://cdn.sanity.io/images/jzq9n05y/production/4ad30e228f5de2d35ce5e1f88927bd3583f30fcf-410x220.png?w=600)

Wow, you made it all the way to the bottom. Congrats!! I am sure there are a lot of little details not mentioned in here, but this shows the overall features of this dashboard. Thanks for following along.

The biggest challenge for this project was the PBIS card system that we use. There is a huge amount of calculations and sorting involved in those. We do a weekly card collection. When that is done the system does a lot of work. It gets all the cards for a TA then it randomly draws one of those to be the weekly winner. If this winner won last week then it will redraw to keep 1 student from winning repeatedly. This gives students who earn more a better shot at winning, but within reason. Then it calculates the number of cards per student in the TA and adds that cards per student number to the cumulative cards per student in the TA. If the new number passes a new multiple of 15 then the Team gets a new reward. Then it repeats this for every other TA in the school and emails the winners to the teacher who takes care of PBIS Rewards.

A quick look at the Tech Stack for this App:

It is a Node server running express hosted on Heroku. The data is on a MongoDB Atlas cluster. All the HTML is templated out with PUG-JS. Sass is used to help with the CSS for the project. Graphs are done with Chart-JS. Because it is generally Server side rendered the only APIs used are for searching for users for the autocomplete.

If you're curious I have started working on the [school dashboard MK II](https://boskind.tech/blog/school-dashboard-mk-ii) with react
