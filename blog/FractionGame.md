---
title: The Fantastic Fraction Game
date: 2020-12-31
description: A game I made for my students to practice adding fractions.
---

### 12-31-2020

![](https://cdn.sanity.io/images/jzq9n05y/production/f70dd2c15720cba5eb483af2df08eaeecd214857-2274x1292.png?w=2274&h=1292&auto=format)

## The Fantastic Fraction Game

So I finally created a completely by myself project. [The Fantastic Fraction Game!](https://boskind.tech/code/theFabulousFractionGame/) I have done many projects by taking a tutorial and rewriting absolutely everything until it bears very little similarity to the original tutorial. This was my first ground-up idea of my own.

It started out as an: I wonder if I can make this game that I give to my math students on paper so they can play it without needing paper all the time. It was also my first chance to really get into some React ideas since I've just started learning react because of the wonderful world of Gatsby. Easy Peasy Lemon Squeezy, add some inputs, and a little bit of formating and were done.

Now that I had it working... what if I added a dice roller, so that kids don't need to use a die to be able to play. Easy Peasy Lemon Squeezy, a little Math.random and some CSS (okay, quite a bit, for that spinning die) and were done.

![](https://cdn.sanity.io/images/jzq9n05y/production/f0ad4230bec5cf919e07a8f37725f144db1aac75-514x400.png?w=600)

Okay, as long as I am automating that... Let's get rid of the inputs and make it so when you roll the dice you can just click on where you want the value to go.

Well if that's going to happen then I might as well make it so that you don't even need another player and you can play against the computer instead. I just need to add so many more things to State, then I need to create an AI player to play against, then I should probably learn how to use Local storage so that I can have people's win/loss persist on their device. **Hard Hard Lemon Hard**, my little 1 hour project took all the coding time I could manage for 3 days.

LocalStorage in Gatsby is a little tricky since its not available in the build step. I had to get a lot better with the useEffect hook to deal with that.

```javascript
useEffect(
  () => setPlayRecord(JSON.parse(localStorage.getItem("playRecord"))),
  []
);

useEffect(
  () => localStorage.setItem("playRecord", JSON.stringify(playRecord)),
  [playRecord]
);
```

So this was fun... Several near rage quits, lots of achievement through perserverence.

[Check out the game here!!](https://boskind.tech/code/theFabulousFractionGame/)​

[Let me know what you think on Twitter @RobBoskind](https://twitter.com/RobBoskind)
