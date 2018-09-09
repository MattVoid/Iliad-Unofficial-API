# Iliad Unofficial API
[![Build Status](https://travis-ci.org/MattVoid/Iliad-Unofficial-API.svg?branch=master)](https://travis-ci.org/MattVoid/Iliad-Unofficial-API)

This is an unofficial API developed to learn. Iliad S.P.A. is not responsible in any way.

This program comes with ABSOLUTELY NO WARRANTY. This is free software, and you are welcome to redistribute it.

```
iliad API
Copyright (C) 2018  Matteo Monteleone

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
```
## Documentation

### Login

##### Description:

Login and get user credential

##### Request:

```
https://iliad-unofficial-api.glitch.me/login/?userid={userid}&password={password}
```

##### Response:

```
{
    "data": {
        "id": "70000000",
        "name": "Matteo Monteleone",
        "number": "350 0000000",
        "token": "3ds6a62do73q617amco2qnli10"
    },
    "status": "success"
}
```

## Logout

##### Description:

Annul token

##### Request:

```
https://iliad-unofficial-api.glitch.me/logout/?&token={toke}
```

##### Response:

```
{
    "data": {},
    "status": "success"
}
```

## Information

##### Description:

Get and change information from "https://www.iliad.it/account/i-miei-dati-personali"

#### Get information

##### Request:

```
https://iliad-unofficial-api.glitch.me/information/get/?token={token}
```
##### Response:

```
{
    "data":
    {
        "address":"Via Gino, 19",
        "cap":"10136 TRINO TO",
        "pay_method":"Manuale",
        "mail":"am.monteleone.am@gmail.com",
        "password":"xxxxxxxx"
    },
    "status":"success"
}
```
if the payment method is with credit card a part of code change
```
{
    data:
    {
        [...]
            "pay_card":"0000 0000 0000 0000 | 01/01/1970",
        [...]
    },
    "status":"success"
}
```

### Error

#### 500

##### Description:

API error

##### Response:

```
{
    "error": "internal server error",
    "status": "error"
}
```

#### 400

##### Description:

Invalid token

##### Response:

```
{
    "error": "Invalid token",
    "status": "error"
}
```

##### Description:

Params undefined

##### Response:

```
{
    "error": "Params cannot be undefined",
    "status": "error"
}
```

## More

https://app.swaggerhub.com/apis/MattVoid/Iliad/docs/1.0.0
