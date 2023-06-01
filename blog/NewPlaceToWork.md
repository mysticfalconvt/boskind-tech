---
title: New Place To Work
date: 2021-01-24
---

![](data:image/svg+xml;charset=utf-8,%3Csvg height='608' width='767' xmlns='http://www.w3.org/2000/svg' version='1.1'%3E%3C/svg%3E)

![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAQCAYAAAAWGF8bAAAACXBIWXMAAAsSAAALEgHS3X78AAAEOklEQVQ4yy2U62/TVRyH+xeQmEAQFmAbY2Vbd+nY2rXdeu+6X1u6rpetXW/rb+3atWu73jY6NxgTBSFgiAQEEQ2LEMGoEW9B4ytealRAE32JJkR5Y/wHHg/EF8/L85zP+Z7POQo54SWTibBQKVA43qTy6hq1zQbZRoFIViaRTZPOZ8kUcuRKS5RrFeqrdVbXmiwulZhwBxix+jH5FnDGGiiiM05SqTDx2gaps7eovfMVp259y8r2N8xd+ozMudvUz3/A+qXbrJy/Tnn9JLVGlXpjmXk5idPhZNQ0gdY6idroRRE4aiQW9RMqniB67ktqtx7z5v0nbN7/m+SdJ6Su/0TtxvdsffyYk3cfUD9zUQhLVJezRMNTGPUjaLQGBkdM9BwxoPA4NMyE3Phyx5g6/QWJ7d8off4XqXv/MHn7KdFrj8i9/QOV7Uc0tx/QOH2Bej1PtTzPXGwKyT6K1SywWbBYzSjGzYMEphxI81UsW/ewvfs7jrvP0N35F/32U4LXfiFz9Wdy1x9Tuvwd1c0z1GoL1JZlSosxsqkg6WSAeYGcCKBwCKF/0oItUUB7/FO0V35Ff/NPet9/Rt/VP3C99ZC5Kz+SvvaQ9IWvyTc3qQhZbTlFrSwopagKlotzlAsJkdA2jM89hnEqTG/2PP1rHzJy4hNUa/forH7EWOU9Ius3kE/dJPHKRTLlEqVinEo5KY79XCq/kFaKQlpIonDaR3DZh1FrBmnVWFBafQxIUXolGZUjgdYZxhtOki4WyItqlUrPJQmRKikk/7OUfCEr50VCp03LqKab9gO7aWnZRcehNvqGdBiE2OWaxuMJEgwFWczFaFRlNlYzbB5bYH0lw0p1nmWxQVGkWyqlBRkULvMAhoFWulp3ohR0de5jcEjDuNNH2B8lKEYRCoVIxkOk5VkKeZniUkbMMUdztUizWWZlrUJjvUF9Y0X00KQkMNaOpNmPTtVC7+H9DPSrMOoMjJutOCx2PJJEwOdjwuNnbNyP3uFjfHKGmJwRBa9y+vV1zp49ztZrTRQxWyc5dxcR6yHUyr207NlNW1s7QwNqrHo9jjEjLpudoy43Zrubfp2dvhEro3YJr1/URY6yIY7/xokcW2spFKmJLkq+HhKOTlTtL7Njx0vs3LmbrkMd6Ab7MWmPYDVoRFIhtxkxmfSiyAbCQTdy3Es4YCY+baUoSyylbELo7KbgVpIeP4ipdy8d+3bR1bYHXV8rTn0XU3Y1My4tYa+eSUmHXtODfkhFLCgxF5EwjvZi0KkIeQ3EAjoUsqRiUeok6zzIrLldzPMgEUc38lE1CwEtuZkx0tNGZn2j2MQjUHYeoL+nk0jAQzg8ybB+CFV/N3aLhtmgFUVaLExPHCZu7SDuUDLv6SPn15CfNpCPmMhGLMwFzS/SaYZ72H9gLwO93cTDAeJzERw+D0cMzz8Itbg4O/8BVmyWIfJ1ICIAAAAASUVORK5CYII=)![](https://cdn.sanity.io/images/jzq9n05y/production/112e15ad51b6ee877030470e813c83b197b5efd4-767x608.png?w=767&h=608&auto=format)

## New place to work

So I decided that Shutting myself away from the family to code wasn't working since I wasn't spending enough time with everyone. I decided to set up a nice spot to work in the living room. Now I can work on some code with a mouse and a screen bigger than 13". It is amazing how much easier it is to work with some screen real estate.

I've done some fun new things lately, like hitting the openlibrary.org API for some book info and covers to avoid making everything need to be completed by hand since info on books totally already exists.

![](https://cdn.sanity.io/images/jzq9n05y/production/75508fb159ca535dd7edd4ec3b30c87eb44ca48d-1239x599.png?w=600)

I put a lot of effort into learning some more CSS to get this website done well. Opacity is a wonderful thing and makes things look pretty cool.

    .glass {
        min-height: 80vh;
        width: 80%;
        max-height: 85vh;
        background: linear-gradient(
          to right bottom,
          rgba(255, 255, 255, 0.6),
          rgba(255, 255, 255, 0.2)
        );
        border-radius: 2rem;
        z-index: 2;
        backdrop-filter: blur(2rem);
        display: grid;
        grid-template-rows: auto 3fr;
        overflow: hidden;
        @media (max-width: 550px) {
          width: 95%;
          min-height: 90vh;
          max-height: 95vh;
        }
      }

![](data:image/svg+xml;charset=utf-8,%3Csvg height='720' width='720' xmlns='http://www.w3.org/2000/svg' version='1.1'%3E%3C/svg%3E)

![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAsSAAALEgHS3X78AAAFK0lEQVQ4yyWT21OaWRbFv9dEBUEjaqvRRGOrUYm2pjVB8ILcQa5y+QC5iIICmigKGPGaqEklY9LpZGqqK9PpTlX3VM3bVM3TPM38X785nX5YVafOqb3OWmvvLb1J2XiXtPA3WccngZ/jJj7nw/x6XOSXq10+nmS4KCxyEBtkx9/FpruT3PIw66FRVtztRB2NRGzNRM0a1uZVSJeynpfhx7wLTHLt+47r4CM+5QP840WJz2ebvCmYOIwOsee/TdHVRtLcQmixjYCAd0GNd15JcE5FzNBMQqdEunBrqS1pObOP8Nw6wJV9kPeRx/xU8PBj1sx5aJCqt4c9Tw95exvRBRV+gxKPoRHPfDM+YwtBo4bwQgf+uQ6kH2zDHNpG2LEMUTX3cW69w0vvfd7nnHx4EuYyOcup/EhAx65vgJS1BdnYSNjUTMTeSdTVg+zoJuzsxWe/h/TGMkrFOkzG2seGrZuKs5vz5ftcl1L88Oqa81KJWiLIkWynHJkmK9TGzSriJhUrVg0xayuyRUPI0obP1Ip0YB6iaPuWqLWbqO0O60t9PBGh156ucvbmN7bL75E9sig0k4+62EjME/f0E7e2Ebe0EDWpSSyqviI8p0DKmO6RtN1Ftt9Bdg0g+0ZIhSbZ3yty9vafZLZfY5hxoJ+aJ5ba4kntgs2tDJmonqQgTtrayJmayInmyLqbSIG5LvzGTsJCYcTVR8g7QEL+nmfVAq9ef6SwUca16MRmdJHKP+for//h9O0X9nfz5OJ6EiKiFdGoiF6B65HoskffinOuFZ+5i5DzLgGXULuspbwT5fVplcONdbZiEYqJFNXKK979+l8+/v4//vLjZ44qm2RCDwiI7LymTvz2fiSnoQX7/C1cpnZxcRe/q59Y8DuqWyFelLKUEj62BZ6uJjh6WubDu7/z6cu/+enLv7h+dU5p3UTc/4Cof5KMPIVk1qlZ0DVi1DdhN91m2TPKZmKWas5NNuwgYNWxElgg6rUg26xU02muDg45PqhR2Uqwt25hZ93B9qqT4ooeaVH4nptWYjLcEnb7ySVmqBac5KJGjLpxzPox0iEDce8MTv1D1lxWCmE/QbtZfPZYRGHmxV6S53urHBR9SGG36Kx3kLSspbRp4GJ/SVgVBc4ZRga/ZVE/zpM1C+VNO5llI+klK8umBQwTY+gnRljxzlIryJztrHL5bBXppBrheN/HWdnD61qAj2cxrvZDOBcf0Xunl4mxYWT/LPmURczfLObpSb4fGWakr5fxgT6C5inKKRdHuSAXO3Gkl8cZXpTDXO0FeFsJ8eEwJh5CeC0zXwm7unoYGuhnQnsf7dAAPR23+UbTzjctGvpvd+BbeMhB2sXznI+LDWH5ZNvHaUFcFBxcbru53A1ysisTDZq5P9TPrVutNKk1NDe1CrShVmloVDahbGiks7UFh/4Be3ELR2kbx0kTUjVt5XDVLLBIJW1mN+sVm5AmsuJHNzVKR5sGhUJFQ4MKpUL9lUwhzvU3G+hp1+DWayn4Z9jy6Si6p5Ge5QJUM0ti3qw8jYl9TbhJZNNEk7IY9seM3usWJI3U1TVQX6+goV5JQ50ClULJg95OInNjZB1TrFkmSBnHkM4qOWo7aSqFGPu5sJipMBtrK2QTYRKeRaa1A8Kmmps36qm7Wf9V2R+E7c1NzI70kVyYIGt5yLpxnMzcKNLpQZGTap5aeYOD0hr7WymK6Qj5eID0soPp8VHUjWpu3Kij7safhAqhskdEYZsYJGOaJGsWEITZeS3/B64YBn4Ij3kVAAAAAElFTkSuQmCC)![](https://cdn.sanity.io/images/jzq9n05y/production/4552e6f0e67b8a97fdd7e4591ea9d9ce34cbb5c2-720x720.png?w=720&h=720&auto=format)

## Post by: Rob Boskind

8th Grade Math Teacher

Code Junkey

Father of all girls

Find me on Twitter [@RobBoskind](https://twitter.com/RobBoskind)​
