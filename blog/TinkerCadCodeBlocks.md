---
title: TinkerCad Code Blocks
date: 2021-08-25
---

![](data:image/svg+xml;charset=utf-8,%3Csvg height='2890' width='5300' xmlns='http://www.w3.org/2000/svg' version='1.1'%3E%3C/svg%3E)

![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAALCAYAAAB/Ca1DAAAACXBIWXMAAAsTAAALEwEAmpwYAAACcUlEQVQokXWT70tTURjH77/Upmhs/k4s55wVyzmcpeZKy1YvjKIgCxICiehVCfWiQDPohehmTqZhgVJoRAMVbdO5H87d3d1z7u9X37hnm9iLXny49z7POZ/zPOecy1nsDpzklK0Vbt8gZoJhiITAMAzous6ehq6z9zJGOV7CjHEWWyuTWOytx8JLPUOYDS2CEMoGqppeRNehGUYR3WDfqqZDKy9gGOAqGp2oaulA5RkXLDUOWGwOdF6+geDCEiiVoGg6eElFlipIizL2cwSxwwISPEGGyCwuyCoTM2H9RR/a/ENo8vSiot7FKvRcuYn58DIIlSAoGvYECbs8xffdNKbCG3j18SsmP29gJZrAVlZEUpRBFK3Y8oXuYVy/Pwa3fwSnm92w2tuYMBRehkAoslRFLC9hOydi7scWHrycxMC95/A/eovx91+wupVkC/KyylrnvL5hjDx8hr7AYzS5/KhucqOr7xZCC0vIiRQporAJO6bw5yaevJvGnfEXGBibwOjrIFZ+xVn+kCqQNR1cp9ePwN1R9Aae4mznCGzneuDtD2BuYQkZgbB2EoKEeJ5gLZ7E1No6JhaX8WbxG2ZXo4juZ1k+TWQUFBVci9MLd/cg2rsCaGi/hupmD6twZj6CA15ESpSRLEiMGC/id+oI6/tpRFNHiOUKOBAoy5njzAPiquqcsDV2oLrhPCrrXLDWOuHpHcanUATxI4FVWBamxBIFCWnRRGYcx0W5eA/LmCdsrWlDV38A08EItjN5xAWKWJ5gr1SJKcgw0b/SotgUnvxL7A5U1DrhvXobH4IRbGZ47OYpdniCP3mKRElo7tf/+AuR8LBvoqkS8AAAAABJRU5ErkJggg==)![](https://cdn.sanity.io/images/jzq9n05y/production/dc4324a75b171092dadff288e25c0962cd3556e9-5300x2890.png?w=5300&h=2890&auto=format)

## TinkerCad Code Blocks

# TinkerCad Code Blocks

During my time at [Create Make Learn,](https://boskind.tech/blog/create-make-learn) I spent some time working with TinkerCad Code Blocks.

My first idea was to create a wheel because I was sitting and looking at a broken wheel that a student had made and 3d printed a few years ago. I remember him really struggling with designing a wheel that was interesting, and symmetrical, and centered correctly.

Like always... there is a better way. And like _almost_ always that way involves some code.

Using Tinkercad Code blocks it is possible to create an item and then move it around programmatically. Once you can do something programmatically, you can use one of my favorite parts of programming... the Loop.

![](https://cdn.sanity.io/images/jzq9n05y/production/4feea177c090d97adc7074c6dd6e593f1d273299-1152x1296.png?w=600)

Using Code Blocks is a nice drag-and-drop interface. We can take pieces of code and plop them right down where we want them. Then we can use these pieces to piece together a design.

Using a couple of cylinders to begin, one solid, and one hole I created a center for the wheel with a hole in the center for an axle. I dilated (scaled) the smaller one so it fit inside.

Then I created 6 spokes and rotated them around the center.

The big piece of the wheel was to avoid using anything round to make the actual wheel. Because I wanted some tread on the wheels I used 18 hexagons each rotated 20 degrees around.

Have a nice look at the design running below and then try your hand at your own [TinkerCad Code Blocks creation.](https://www.tinkercad.com/)​

![](https://cdn.sanity.io/images/jzq9n05y/production/5c5737097dc60707f6bb27f2c7bf7199f85123b8-1424x1363.gif?w=600)

![](data:image/svg+xml;charset=utf-8,%3Csvg height='720' width='720' xmlns='http://www.w3.org/2000/svg' version='1.1'%3E%3C/svg%3E)

![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAsSAAALEgHS3X78AAAFK0lEQVQ4yyWT21OaWRbFv9dEBUEjaqvRRGOrUYm2pjVB8ILcQa5y+QC5iIICmigKGPGaqEklY9LpZGqqK9PpTlX3VM3bVM3TPM38X785nX5YVafOqb3OWmvvLb1J2XiXtPA3WccngZ/jJj7nw/x6XOSXq10+nmS4KCxyEBtkx9/FpruT3PIw66FRVtztRB2NRGzNRM0a1uZVSJeynpfhx7wLTHLt+47r4CM+5QP840WJz2ebvCmYOIwOsee/TdHVRtLcQmixjYCAd0GNd15JcE5FzNBMQqdEunBrqS1pObOP8Nw6wJV9kPeRx/xU8PBj1sx5aJCqt4c9Tw95exvRBRV+gxKPoRHPfDM+YwtBo4bwQgf+uQ6kH2zDHNpG2LEMUTX3cW69w0vvfd7nnHx4EuYyOcup/EhAx65vgJS1BdnYSNjUTMTeSdTVg+zoJuzsxWe/h/TGMkrFOkzG2seGrZuKs5vz5ftcl1L88Oqa81KJWiLIkWynHJkmK9TGzSriJhUrVg0xayuyRUPI0obP1Ip0YB6iaPuWqLWbqO0O60t9PBGh156ucvbmN7bL75E9sig0k4+62EjME/f0E7e2Ebe0EDWpSSyqviI8p0DKmO6RtN1Ftt9Bdg0g+0ZIhSbZ3yty9vafZLZfY5hxoJ+aJ5ba4kntgs2tDJmonqQgTtrayJmayInmyLqbSIG5LvzGTsJCYcTVR8g7QEL+nmfVAq9ef6SwUca16MRmdJHKP+for//h9O0X9nfz5OJ6EiKiFdGoiF6B65HoskffinOuFZ+5i5DzLgGXULuspbwT5fVplcONdbZiEYqJFNXKK979+l8+/v4//vLjZ44qm2RCDwiI7LymTvz2fiSnoQX7/C1cpnZxcRe/q59Y8DuqWyFelLKUEj62BZ6uJjh6WubDu7/z6cu/+enLv7h+dU5p3UTc/4Cof5KMPIVk1qlZ0DVi1DdhN91m2TPKZmKWas5NNuwgYNWxElgg6rUg26xU02muDg45PqhR2Uqwt25hZ93B9qqT4ooeaVH4nptWYjLcEnb7ySVmqBac5KJGjLpxzPox0iEDce8MTv1D1lxWCmE/QbtZfPZYRGHmxV6S53urHBR9SGG36Kx3kLSspbRp4GJ/SVgVBc4ZRga/ZVE/zpM1C+VNO5llI+klK8umBQwTY+gnRljxzlIryJztrHL5bBXppBrheN/HWdnD61qAj2cxrvZDOBcf0Xunl4mxYWT/LPmURczfLObpSb4fGWakr5fxgT6C5inKKRdHuSAXO3Gkl8cZXpTDXO0FeFsJ8eEwJh5CeC0zXwm7unoYGuhnQnsf7dAAPR23+UbTzjctGvpvd+BbeMhB2sXznI+LDWH5ZNvHaUFcFBxcbru53A1ysisTDZq5P9TPrVutNKk1NDe1CrShVmloVDahbGiks7UFh/4Be3ELR2kbx0kTUjVt5XDVLLBIJW1mN+sVm5AmsuJHNzVKR5sGhUJFQ4MKpUL9lUwhzvU3G+hp1+DWayn4Z9jy6Si6p5Ge5QJUM0ti3qw8jYl9TbhJZNNEk7IY9seM3usWJI3U1TVQX6+goV5JQ50ClULJg95OInNjZB1TrFkmSBnHkM4qOWo7aSqFGPu5sJipMBtrK2QTYRKeRaa1A8Kmmps36qm7Wf9V2R+E7c1NzI70kVyYIGt5yLpxnMzcKNLpQZGTap5aeYOD0hr7WymK6Qj5eID0soPp8VHUjWpu3Kij7safhAqhskdEYZsYJGOaJGsWEITZeS3/B64YBn4Ij3kVAAAAAElFTkSuQmCC)![](https://cdn.sanity.io/images/jzq9n05y/production/4552e6f0e67b8a97fdd7e4591ea9d9ce34cbb5c2-720x720.png?w=720&h=720&auto=format)

## Post by: Rob Boskind

8th Grade Math Teacher

Code Junkey

Father of all girls

Find me on Twitter [@RobBoskind](https://twitter.com/RobBoskind)​
