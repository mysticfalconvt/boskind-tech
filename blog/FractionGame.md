---
title: The Fantastic Fraction Game
date: 2020-12-31
---

### 12-31-2020

![](data:image/svg+xml;charset=utf-8,%3Csvg height='1292' width='2274' xmlns='http://www.w3.org/2000/svg' version='1.1'%3E%3C/svg%3E)

![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAALCAYAAAB/Ca1DAAAACXBIWXMAABYlAAAWJQFJUiTwAAACaklEQVQoz2WSXUhTYRjH3xPpKYKkiyApC3JKikbR0rqwghaVQfYBBkVBBF153V03lRBdBVkUsaWBOSESyzVna86dnbPEzeOWEYUizVZkalPb3Pn8955z/Mi6+PG8PO/z/p73i2iaBlVRoMiyiUzJZDJIpVJIJBKIRqMmsVjMjKIoIplMmjWSJJn1Bgp1GC4yPSVi/FsYY+NBjCWDtDiAryMejMbbMdzfjITgsoi4EBecJp/FZ/gx6kE65cfc915KAJkJDvJMHKSDv4o73fVo9J1Ho/ccHnpPYCjkwKRwEJP8gf/4yddgis7NDjiQFY9hfqiWchzS+9NQRxpAGlq3w/6gENUtFdjjtKHu0Tq8ebUaEp8HXciDZsAvIPxLPiSORS6UDzWyHrpYAXLBVYjSpk3Y3WpHuasMh+6z6OokkMMEEAh0nkANWxhjI7eIRnPZIINMgEAJs8CgDeRi8xZUPSlDne8MjnQcRu3jDSuEGpXIIQYyxywJF6MhnA+uokIGCr+GCktArjwtgsO9C5eFS6j3n8TZlo3wvlwQ0oUKR5ALEkh9luBvoREl2ixH51SBtYRNL4pwzV2Mm69rcL3TjlttBRjspgXGUans91sGv3oYzPrpLkMrj22MNZ4xG+kRQ1gK8sW/FR+at2H4biUS93bgk7sAM71WsUIF6R6CCQ/BtM/aqSnkl+MSkTzrDnWuHKqzAvKN/ZBuV0Fp3wydWwu8y6evyCLbxyLtZzHXy5oXb+4kYsVl6I/op688tBMkN3AU2a69yLZVI/d8H5RAJfRoidlNp2gxG5QBC52OF/MriBVTGV338RT+AGcKdOYUw58eAAAAAElFTkSuQmCC)![](https://cdn.sanity.io/images/jzq9n05y/production/f70dd2c15720cba5eb483af2df08eaeecd214857-2274x1292.png?w=2274&h=1292&auto=format)

## The Fantastic Fraction Game

So I finally created a completely by myself project. [The Fantastic Fraction Game!](https://boskind.tech/code/theFabulousFractionGame/) I have done many projects by taking a tutorial and rewriting absolutely everything until it bears very little similarity to the original tutorial. This was my first ground-up idea of my own.

It started out as an: I wonder if I can make this game that I give to my math students on paper so they can play it without needing paper all the time. It was also my first chance to really get into some React ideas since I've just started learning react because of the wonderful world of Gatsby. Easy Peasy Lemon Squeezy, add some inputs, and a little bit of formating and were done.

Now that I had it working... what if I added a dice roller, so that kids don't need to use a die to be able to play. Easy Peasy Lemon Squeezy, a little Math.random and some CSS (okay, quite a bit, for that spinning die) and were done.

![](https://cdn.sanity.io/images/jzq9n05y/production/f0ad4230bec5cf919e07a8f37725f144db1aac75-514x400.png?w=600)

Okay, as long as I am automating that... Let's get rid of the inputs and make it so when you roll the dice you can just click on where you want the value to go.

Well if that's going to happen then I might as well make it so that you don't even need another player and you can play against the computer instead. I just need to add so many more things to State, then I need to create an AI player to play against, then I should probably learn how to use Local storage so that I can have people's win/loss persist on their device. **Hard Hard Lemon Hard**, my little 1 hour project took all the coding time I could manage for 3 days.

LocalStorage in Gatsby is a little tricky since its not available in the build step. I had to get a lot better with the useEffect hook to deal with that.

    useEffect(()=>setPlayRecord(JSON.parse(localStorage.getItem('playRecord'))),[]);

    useEffect(()=>localStorage.setItem('playRecord',JSON.stringify(playRecord)),[playRecord]);

So this was fun... Several near rage quits, lots of achievement through perserverence.

[Check out the game here!!](https://boskind.tech/code/theFabulousFractionGame/)​

[Let me know what you think on Twitter @RobBoskind](https://twitter.com/RobBoskind)

![](data:image/svg+xml;charset=utf-8,%3Csvg height='720' width='720' xmlns='http://www.w3.org/2000/svg' version='1.1'%3E%3C/svg%3E)

![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAsSAAALEgHS3X78AAAFK0lEQVQ4yyWT21OaWRbFv9dEBUEjaqvRRGOrUYm2pjVB8ILcQa5y+QC5iIICmigKGPGaqEklY9LpZGqqK9PpTlX3VM3bVM3TPM38X785nX5YVafOqb3OWmvvLb1J2XiXtPA3WccngZ/jJj7nw/x6XOSXq10+nmS4KCxyEBtkx9/FpruT3PIw66FRVtztRB2NRGzNRM0a1uZVSJeynpfhx7wLTHLt+47r4CM+5QP840WJz2ebvCmYOIwOsee/TdHVRtLcQmixjYCAd0GNd15JcE5FzNBMQqdEunBrqS1pObOP8Nw6wJV9kPeRx/xU8PBj1sx5aJCqt4c9Tw95exvRBRV+gxKPoRHPfDM+YwtBo4bwQgf+uQ6kH2zDHNpG2LEMUTX3cW69w0vvfd7nnHx4EuYyOcup/EhAx65vgJS1BdnYSNjUTMTeSdTVg+zoJuzsxWe/h/TGMkrFOkzG2seGrZuKs5vz5ftcl1L88Oqa81KJWiLIkWynHJkmK9TGzSriJhUrVg0xayuyRUPI0obP1Ip0YB6iaPuWqLWbqO0O60t9PBGh156ucvbmN7bL75E9sig0k4+62EjME/f0E7e2Ebe0EDWpSSyqviI8p0DKmO6RtN1Ftt9Bdg0g+0ZIhSbZ3yty9vafZLZfY5hxoJ+aJ5ba4kntgs2tDJmonqQgTtrayJmayInmyLqbSIG5LvzGTsJCYcTVR8g7QEL+nmfVAq9ef6SwUca16MRmdJHKP+for//h9O0X9nfz5OJ6EiKiFdGoiF6B65HoskffinOuFZ+5i5DzLgGXULuspbwT5fVplcONdbZiEYqJFNXKK979+l8+/v4//vLjZ44qm2RCDwiI7LymTvz2fiSnoQX7/C1cpnZxcRe/q59Y8DuqWyFelLKUEj62BZ6uJjh6WubDu7/z6cu/+enLv7h+dU5p3UTc/4Cof5KMPIVk1qlZ0DVi1DdhN91m2TPKZmKWas5NNuwgYNWxElgg6rUg26xU02muDg45PqhR2Uqwt25hZ93B9qqT4ooeaVH4nptWYjLcEnb7ySVmqBac5KJGjLpxzPox0iEDce8MTv1D1lxWCmE/QbtZfPZYRGHmxV6S53urHBR9SGG36Kx3kLSspbRp4GJ/SVgVBc4ZRga/ZVE/zpM1C+VNO5llI+klK8umBQwTY+gnRljxzlIryJztrHL5bBXppBrheN/HWdnD61qAj2cxrvZDOBcf0Xunl4mxYWT/LPmURczfLObpSb4fGWakr5fxgT6C5inKKRdHuSAXO3Gkl8cZXpTDXO0FeFsJ8eEwJh5CeC0zXwm7unoYGuhnQnsf7dAAPR23+UbTzjctGvpvd+BbeMhB2sXznI+LDWH5ZNvHaUFcFBxcbru53A1ysisTDZq5P9TPrVutNKk1NDe1CrShVmloVDahbGiks7UFh/4Be3ELR2kbx0kTUjVt5XDVLLBIJW1mN+sVm5AmsuJHNzVKR5sGhUJFQ4MKpUL9lUwhzvU3G+hp1+DWayn4Z9jy6Si6p5Ge5QJUM0ti3qw8jYl9TbhJZNNEk7IY9seM3usWJI3U1TVQX6+goV5JQ50ClULJg95OInNjZB1TrFkmSBnHkM4qOWo7aSqFGPu5sJipMBtrK2QTYRKeRaa1A8Kmmps36qm7Wf9V2R+E7c1NzI70kVyYIGt5yLpxnMzcKNLpQZGTap5aeYOD0hr7WymK6Qj5eID0soPp8VHUjWpu3Kij7safhAqhskdEYZsYJGOaJGsWEITZeS3/B64YBn4Ij3kVAAAAAElFTkSuQmCC)![](https://cdn.sanity.io/images/jzq9n05y/production/4552e6f0e67b8a97fdd7e4591ea9d9ce34cbb5c2-720x720.png?w=720&h=720&auto=format)

## Post by: Rob Boskind

8th Grade Math Teacher

Code Junkey

Father of all girls

Find me on Twitter [@RobBoskind](https://twitter.com/RobBoskind)​
