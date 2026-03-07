module.exports = [

{
title:"Island Breeze",
tempo:82,
strum:"Down Down Up Up Down",
picking:"G C E A",
tabs:`C     G     Am     F

A|--3-|--2-|--0-|--0-|
E|--0-|--3-|--0-|--1-|
C|--0-|--2-|--0-|--0-|
G|--0-|--0-|--2-|--2-|`
},

{
title:"Sunset Walk",
tempo:85,
strum:"Down Up Down Up",
picking:"G E C A",
tabs:`G     D     Em     C

A|--2-|--0-|--2-|--3-|
E|--3-|--2-|--3-|--0-|
C|--2-|--2-|--4-|--0-|
G|--0-|--2-|--0-|--0-|`
},

{
title:"Ocean Mood",
tempo:78,
strum:"Down Down Up",
picking:"G C E C",
tabs:`Am     F     C     G

A|--0-|--0-|--3-|--2-|
E|--0-|--1-|--0-|--3-|
C|--0-|--0-|--0-|--2-|
G|--2-|--2-|--0-|--0-|`
},

{
title:"Golden Coast",
tempo:90,
strum:"Down Up Down",
picking:"G C E A",
tabs:`F     C     G     C

A|--0-|--3-|--2-|--3-|
E|--1-|--0-|--3-|--0-|
C|--0-|--0-|--2-|--0-|
G|--2-|--0-|--0-|--0-|`
},

{
title:"Island Rhythm",
tempo:88,
strum:"Down Down Up Up",
picking:"G E C A",
tabs:`C     Am     F     G

A|--3-|--0-|--0-|--2-|
E|--0-|--0-|--1-|--3-|
C|--0-|--0-|--0-|--2-|
G|--0-|--2-|--2-|--0-|`
},

{
title:"Blue Horizon",
tempo:84,
strum:"Down Up Down Up",
picking:"G C E C",
tabs:`G     Em     C     D

A|--2-|--2-|--3-|--0-|
E|--3-|--3-|--0-|--2-|
C|--2-|--4-|--0-|--2-|
G|--0-|--0-|--0-|--2-|`
},

{
title:"Morning Waves",
tempo:80,
strum:"Down Down Up",
picking:"G C E A",
tabs:`Am     C     G     F

A|--0-|--3-|--2-|--0-|
E|--0-|--0-|--3-|--1-|
C|--0-|--0-|--2-|--0-|
G|--2-|--0-|--0-|--2-|`
},

{
title:"Palm Tree Song",
tempo:92,
strum:"Down Up Down",
picking:"G E C A",
tabs:`D     G     A     G

A|--0-|--2-|--0-|--2-|
E|--2-|--3-|--0-|--3-|
C|--2-|--2-|--1-|--2-|
G|--2-|--0-|--2-|--0-|`
},

{
title:"Lagoon Flow",
tempo:76,
strum:"Down Down Up Up",
picking:"G C E C",
tabs:`C     F     G     C

A|--3-|--0-|--2-|--3-|
E|--0-|--1-|--3-|--0-|
C|--0-|--0-|--2-|--0-|
G|--0-|--2-|--0-|--0-|`
},

{
title:"Sunrise Ride",
tempo:86,
strum:"Down Up Down",
picking:"G C E A",
tabs:`Em     C     G     D

A|--2-|--3-|--2-|--0-|
E|--3-|--0-|--3-|--2-|
C|--4-|--0-|--2-|--2-|
G|--0-|--0-|--0-|--2-|`
},

...Array.from({length:40}).map((_,i)=>({

title:"Uke Pattern "+(i+11),

tempo:80+(i%10)*2,

strum:"Down Up Down Up",

picking:["G C E A","G E C A","G C E C"][i%3],

tabs:`C     G     Am     F

A|--3-|--2-|--0-|--0-|
E|--0-|--3-|--0-|--1-|
C|--0-|--2-|--0-|--0-|
G|--0-|--0-|--2-|--2-|`

}))

]
