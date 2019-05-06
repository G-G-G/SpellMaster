# SpellMaster
A spell-management system for D&amp;D 5e on Roll20

Thread: https://app.roll20.net/forum/post/7420759/script-spellmaster-5e-ogl-spell-handling-script

Setup Info in case it gets deleted:

# SpellMaster
SpellMaster is an Airbag-compatible script specifically built to be expandable and to allow DMs to add homebrew content.  The SRD spells are in the SRD.js file as an enormous array of objects.  To add new spells, simply follow the format and add your own (or write a parser like I did to build this list in the first place).

SpellMaster is intended as a total replacement for the Spells page of the OGL character sheet with several additional key features that go beyond the default spells page:

**Instant Import:** Instantly add any spell in your master spell list to a character's spellbook.  Additionally, you can import a class's entire spell list to a spellbook during setup.
**Filtering:** filter by VSM, Ritual, Concentration, Preparedness, Slots Remaining, and the inverse of all of these.  Additionally, a general string search is provided.
**Preparation Lists:** Create and configure independent lists of prepared spells for every scenario.
**Locking:** Supports spells that are both conditionally prepared and always prepared, even those that can be used a finite number of times a day without expending slots.
**Performance:** SpellMaster is built to support games with hundreds of spells in play without slowing to a crawl.

## Setup
1. Install SRD.js followed by SpellMaster.js as API scripts in your game.

2. Create a Handout with a unique name of your choice such as "Tazeka's Spells."  Give Tazeka's player access to the handout.  This handout will become Tazeka's spellbook, fully replacing all need for the 5e OGL sheet's Spells page.

3. Run the command below.
    !SpellMaster --Menu
4. In the chat window, a simple menu will appear.  Press [Create Spellbook].  You will be prompted for several fields.  Fill them out.

5. Navigate to the handout and see that it's been populated!  Tazeka now has a dedicated spellbook!

6. Make any final adjustments to the numbers of spell slots by pressing those hyperlinks.

7. Go to Tazeka's character sheet and add the below to the Bio & Info tab, replacing it of course with your own spellbook name.

[Tazeka's Spells]
Operation
Filtering
At the top of the sheet, you'll see the ability to filter by presence (or absence!) of VSM components, as well as concentration, ritual, preparedness, slots remaining, and a general string search.  String search checks spell names, descriptions, notes, and classes for the provided string. 

Regex strings are not supported at this time.

## Tools
At present, the only tool that exists is the Long Rest button.  It will refill all slots to their maximum.  In the future, I may consider adding a UI to create spells, but my table has a dedicated file for homebrew spells and I have a parser for it already, so I doubt I'll ever get around to it.

## Prepared
This counter takes the form of...

[Currently Prepared] / [Class1 MaxPreparation] ([Class1 Name]) / [Class2 MaxPreparation]...
This counter does not include Locked spells (see below).  It does not restrict a user from over-preparing as there are simply too many ways that could be legitimate, so it simply marks how many are prepared and its best guess for how many you should have prepared at most.

## Spells
Spells appear within their level in alphabetical order.  What a given spell looks like will make more sense with an example, so here's a spell I wrote.



**Level 1 Spells - [4] / [4]:** The initial line denotes the spell level and current spell slots.  Click on a number to change it.  Currents can be higher than maximums, but Long Rest will set everything back to the maximum.
[_] Azdregath's Opulent Ooze (R) - [-]: The line with the spell's name on it has several features.
[_]: Clicking on this empty checkbox will mark it as prepared.  Prepared spells are marked with [X].  Cantrips are always checked.
Azdregath's Opulent Ooze: Clicking this link will attempt to cast the spell.  See casting details below.
(R): SpellMaster flags any Rituals or Concentration spells with tags at this location.
[-]: Pressing this will collapse the details of the spell and turn it into [+] instead.
[0] / [0]: Should you have a spell you can cast a finite number of times a day without expending a spell slot (such as certain racial features or possession of a magical item), you can edit its current slots and maximum slots here.  (At present, I do not have detailed item support, though I would be interested in adding it in the future.)  If these are non-zero, they will appear in the name line of a spell instead of only being visible when you expand the spell.
Details: The next several lines simply provide the details for the spell, just as you'd expect.
Ability: Clicking on this will allow you to choose the spellcasting ability for this spell.
Notes: Clicking on this allows you to edit the notes for a spell.  I recommend things like "From Artificer" for multiclassing or "Utility" so that the Search function can find this spell easier.  There's usually no need to specify things like "VS Undead" because of prepared spell lists (below).
Classes: This is the list of classes that a spell belongs to.  Because of the way my parsers work, SRD also shows up as a class.
[Delete]: This brings up a confirmation box to delete the spell from this spellbook.
[Lock]: This Locks a spell as permanently prepared, handy for classes with permanently prepared spells like Sorcerers, Druids, or Clerics.  I also use it for items.  If a spell is locked, its preparedness checkbox will show up not as [_] or [X], but rather [O] and it will not count toward the preparedness counter at the top of the page.  However, if you filter by preparedness, a Locked spell is counted as prepared and will show up.
The plus button at the end of a spell level allows you to import a new spell from the master spell list by name.

## Preparation Lists
As before, it's easier with a picture.
https://s3.amazonaws.com/files.d20.io/images/80550483/w_qPIC6VAFEq8rXpCCVNrg/med.PNG?1556980289

These function as radio buttons: press the checkbox for one and the others are unchecked.  Any preparedness changes you make to a spell on one preparation list are unique to that list.  Locked spells are global to the spellbook and do not change between preparedness lists.  The parenthetical number is the number of prepared spells in that list.

Click on a list's name to change it, the [-] to delete it, or the [+] to add a new one.

## Casting Spells with SpellMaster
When you cast a spell with SpellMaster, you'll first be presented (if needed) with a list of spell levels you can cast the spell at.  If you have per-spell slots, it will automatically consume them before taking up your main slots.

Upon selecting a level, the spell card will be whispered to the caster and GM (I got tired of meta knowledge influencing things at my table).  Rolls within the table are automatically calculated.  If there is a spell attack, it will appear at the top (otherwise defaulting to 0), and the caster's relevant spellcasting ability DC will be posted in all cases.

## Performance
Part of what influenced my decision to do this was I wanted a solution that could be performant at all levels of play.  For this reason...

The master spell list is stored in an API script (to avoid sucking up a surprising amount of the 2 MB cap of state and not cause a performance hitch from trying to parse it out of something like gmnotes). 
Expensive operations are cached, so that only part of the page has to be regenerated at a time.  I anticipate adding more granular caching in the future.
Spellbooks are in handouts rather than the main character sheet because loading a character sheet can take a painfully long time.  However, for convenience, the top of a spellbook contains an automatically-generated link to the character sheet.

## Releases
1.0: Initial Release

## Future Work
A few things I'd like to add in the future...

**Constant DCs:** At present, a spell must have an ability score as its DC, but this is meaningless for many items, as they have a constant DC.
**Short Rest Recharge:** Certainly, I can't fully support every conceivable thing that happens on short rest, but I can at least add something.  Most notably, I would like to support pact magic recharging.
**Variable Recharge Rates:** allow certain things (like items) to regenerate non-standard amounts.
**Regex Searching:** It's a handy feature.
