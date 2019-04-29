if (typeof MarkStart != 'undefined') MarkStart('SpellMaster');
if(!SpellList) throw new Exception("Spell List Not Included!");
const SpellDict = {};

if(!state.SpellMaster) {
    state.SpellMaster = {};
}

on('ready', () => {
    const chatTrigger = '!SpellMaster';// This is the trigger that makes the script listen
    const scname = 'SpellMaster';// How this script shows up when it sends chat messages
    const maxSpellLevel = 10;// My campaign has a few NPCs with 10th-level magic

    let SpellsIndexed = false;

    // Creates dictionary of spell
    const IndexSpellbook = () => {
        for(let i = 0; i < SpellList.length; i++){
            let spell = SpellList[i];
            SpellDict[spell.Name] = spell;
        }
        SpellsIndexed = true;
    };
    IndexSpellbook();
    log("Spellbook Indexed with " + SpellList.length + " spells.");

    // Retrieves a handout by name
    const GetHandout = (nameOrId) => {
        let list = findObjs({
            _type: 'handout',
            name: nameOrId,
        });
        if (list.length === 1) {
            return list[0];
        }

        list = findObjs({
            _type: 'handout',
            id: nameOrId
        });
        if (list.length === 1) {
            return list[0];
        }
    };

    // Retrieves a character by name or id
    const GetCharByAny = (nameOrId) => {
        let character = null;

        // Try to directly load the character ID
        character = getObj('character', nameOrId);
        if (character) {
            return character;
        }

        // Try to load indirectly from the token ID
        const token = getObj('graphic', nameOrId);
        if (token) {
            character = getObj('character', token.get('represents'));
            if (character) {
                return character;
            }
        }

        // Try loading through char name
        const list = findObjs({
            _type: 'character',
            name: nameOrId,
        });
        if (list.length === 1) {
            return list[0];
        }

        // Default to null
        return null;
    };

    // Retrieves the value stored in the parameter with the provided name
    const GetParamValue = (argParams, paramName) => {
        const id = GetParamId(argParams, paramName);
        if(id === -1){
            return null;
        }
        return Decaret(argParams[id]);
    };

    // Retrieves the index in the array of params for the specified parameter
    const GetParamId = (argParams, paramName) => {
        for(let i = 0; i < argParams.length; i++){
            let arg = argParams[i];
            const argWords = arg.split(/\s+/);
            if(argWords[0] == paramName){
                return i;
            }
        }
        return -1;
    };

    // Pulls the interior message out of carets
    const Decaret = (quotedString) => {
        const startQuote = quotedString.indexOf('^');
        const endQuote = quotedString.lastIndexOf('^');
        if (startQuote >= endQuote) {
            if (!quietMode) {
                sendChat(scname, `**ERROR:** You must have a string within carets in the phrase ${string}`);
            }
            return null;
        }
        return quotedString.substring(startQuote + 1, endQuote);
    };
    
    // Enum of caster types
    const CasterMode = {
        Invalid: -1,
        Full: 0,
        Half: 1,
        Third: 2,
        Pact: 3,
        None: 4
    };

    // A dictionary of caster types
    const CasterTypeMap = {};

    // Perform initial configuration for caster type mappings
    const MapCasterTypes = () => {
        CasterTypeMap['Artificer'] = CasterMode.Full;
        CasterTypeMap['Barbarian'] = CasterMode.None;
        CasterTypeMap['Bard'] = CasterMode.Full;
        CasterTypeMap['Cleric'] = CasterMode.Full;
        CasterTypeMap['Druid'] = CasterMode.Full;
        CasterTypeMap['Fighter'] = CasterMode.Third;
        CasterTypeMap['Monk'] = CasterMode.Full;
        CasterTypeMap['Paladin'] = CasterMode.Half;
        CasterTypeMap['Ranger'] = CasterMode.Half;
        CasterTypeMap['Rogue'] = CasterMode.Third;
        CasterTypeMap['Shaman'] = CasterMode.Full;
        CasterTypeMap['Sorcerer'] = CasterMode.Full;
        CasterTypeMap['Warlock'] = CasterMode.Pact;
        CasterTypeMap['Wizard'] = CasterMode.Full;
        CasterTypeMap[null] = CasterMode.None;
    };
    MapCasterTypes();

    // Get a caster type from the map
    const GetCasterTypeFromClass = (className) => {
        try {
            return CasterTypeMap[className];
        } catch (e) {
            log('Invalid class: ' + className);
            return CasterMode.Invalid;
        }
    };

    // Get default spell slot array for a caster type and level
    const GetBaseSpellSlots = (casterMode, level) => {
        if (casterMode === CasterMode.Full){
            const fullCasterSlots = [
                [2,0,0,0,0,0,0,0,0],// 1
                [3,0,0,0,0,0,0,0,0],// 2
                [4,2,0,0,0,0,0,0,0],// 3
                [4,3,0,0,0,0,0,0,0],// 4
                [4,3,2,0,0,0,0,0,0],// 5
                [4,3,3,0,0,0,0,0,0],// 6
                [4,3,3,1,0,0,0,0,0],// 7
                [4,3,3,2,0,0,0,0,0],// 8
                [4,3,3,3,1,0,0,0,0],// 9
                [4,3,3,3,2,0,0,0,0],// 10
                [4,3,3,3,2,1,0,0,0],// 11
                [4,3,3,3,2,1,0,0,0],// 12
                [4,3,3,3,2,1,1,0,0],// 13
                [4,3,3,3,2,1,1,0,0],// 14
                [4,3,3,3,2,1,1,1,0],// 15
                [4,3,3,3,2,1,1,1,0],// 16
                [4,3,3,3,2,1,1,1,1],// 17
                [4,3,3,3,3,1,1,1,1],// 18
                [4,3,3,3,3,2,1,1,1],// 19
                [4,3,3,3,3,2,2,1,1],// 20
            ];
            return fullCasterSlots[level-1];
        } else if(casterMode === CasterMode.Half) {
            const halfCasterSlots = [
                [0,0,0,0,0,0,0,0,0],// 1
                [2,0,0,0,0,0,0,0,0],// 2
                [3,0,0,0,0,0,0,0,0],// 3
                [3,0,0,0,0,0,0,0,0],// 4
                [4,2,0,0,0,0,0,0,0],// 5
                [4,2,0,0,0,0,0,0,0],// 6
                [4,3,0,0,0,0,0,0,0],// 7
                [4,3,0,0,0,0,0,0,0],// 8
                [4,3,2,0,0,0,0,0,0],// 9
                [4,3,2,0,0,0,0,0,0],// 10
                [4,3,3,0,0,0,0,0,0],// 11
                [4,3,3,0,0,0,0,0,0],// 12
                [4,3,3,1,0,0,0,0,0],// 13
                [4,3,3,1,0,0,0,0,0],// 14
                [4,3,3,2,0,0,0,0,0],// 15
                [4,3,3,2,0,0,0,0,0],// 16
                [4,3,3,2,1,0,0,0,0],// 17
                [4,3,3,2,1,0,0,0,0],// 18
                [4,3,3,2,2,0,0,0,0],// 19
                [4,3,3,2,2,0,0,0,0],// 20
            ];
            return halfCasterSlots[level-1];
        } else if (casterMode === CasterMode.Third) {
            const thirdCasterSlots = [
                [0,0,0,0,0,0,0,0,0],// 1
                [0,0,0,0,0,0,0,0,0],// 2
                [2,0,0,0,0,0,0,0,0],// 3
                [3,0,0,0,0,0,0,0,0],// 4
                [3,0,0,0,0,0,0,0,0],// 5
                [3,0,0,0,0,0,0,0,0],// 6
                [4,2,0,0,0,0,0,0,0],// 7
                [4,2,0,0,0,0,0,0,0],// 8
                [4,2,0,0,0,0,0,0,0],// 9
                [4,3,0,0,0,0,0,0,0],// 10
                [4,3,0,0,0,0,0,0,0],// 11
                [4,3,0,0,0,0,0,0,0],// 12
                [4,3,2,0,0,0,0,0,0],// 13
                [4,3,2,0,0,0,0,0,0],// 14
                [4,3,2,0,0,0,0,0,0],// 15
                [4,3,3,0,0,0,0,0,0],// 16
                [4,3,3,0,0,0,0,0,0],// 17
                [4,3,3,0,0,0,0,0,0],// 18
                [4,3,3,1,0,0,0,0,0],// 19
                [4,3,3,1,0,0,0,0,0],// 20
            ];
            return thirdCasterSlots[level-1];
        } else if (casterMode === CasterMode.Pact) {
            const pactCasterSlots = [
                [1,0,0,0,0,0,0,0,0],// 1
                [2,0,0,0,0,0,0,0,0],// 2
                [0,2,0,0,0,0,0,0,0],// 3
                [0,2,0,0,0,0,0,0,0],// 4
                [0,0,2,0,0,0,0,0,0],// 5
                [0,0,2,0,0,0,0,0,0],// 6
                [0,0,0,2,0,0,0,0,0],// 7
                [0,0,0,2,0,0,0,0,0],// 8
                [0,0,0,0,2,0,0,0,0],// 9
                [0,0,0,0,2,0,0,0,0],// 10
                [0,0,0,0,3,1,0,0,0],// 11
                [0,0,0,0,3,1,0,0,0],// 12
                [0,0,0,0,3,1,1,0,0],// 13
                [0,0,0,0,3,1,1,0,0],// 14
                [0,0,0,0,3,1,1,1,0],// 15
                [0,0,0,0,3,1,1,1,0],// 16
                [0,0,0,0,3,1,1,1,1],// 17
                [0,0,0,0,3,1,1,1,1],// 18
                [0,0,0,0,3,1,1,1,1],// 19
                [0,0,0,0,3,1,1,1,1],// 20
            ];
            return pactCasterSlots[level-1];
        } else {
            return [0,0,0,0,0,0,0,0,0];
        }
    };

    // Creates a link 
    const CreateLink = (text, linkTo) => {
        return `<a href="${linkTo}">${text}</a>`;
    };

    // All sorters available to SpellMaster
    const Sorters = {
        NameAlpha: (a, b) => {
            const nameA=a.Name.toLowerCase();
            const nameB=b.Name.toLowerCase();
            if (nameA < nameB) //sort string ascending
            {
                return -1;
            }
            if (nameA > nameB)
            {
                return 1;
            }
            return 0 //default return value (no sorting)
        }
    };

    // Filtration options
    const Filters = {
        WithFlag: 0,
        WithoutFlag: 1,
        NotApplicable: 2
    };
    const FilterSymbols = ['X', '!', '_'];

    // Generates the casting link for a spell
    const CreateSpellLink = (spell) => {
        
    };

    // Prints a spellbook out to its handout
    const PrintSpellbook = (spellbook) => {
        const activePrepList = spellbook.PreparationLists[spellbook.ActivePrepList];
        let text = "";
        let br = "<br/>";
        let hr = "<hr>";

        // Owner
        let uri = `http://journal.roll20.net/character/${GetCharByAny(spellbook.Owner).id}`;
        text += `<i>A spellbook for </i>${CreateLink(spellbook.Owner, uri)}`;
        text += '<hr>';

        // Filter bar
        const vFilter = CreateLink(`[${FilterSymbols[spellbook.Filter.V]}]`, `!SpellMaster --UpdateBook ^${spellbook.Name}^ --ParamName ^V^ --ParamValue ^?{Please enter the new filter option|V,${Filters.WithFlag}|No-V,${Filters.WithoutFlag}|No Filter,${Filters.NotApplicable}}^`);
        const sFilter = CreateLink(`[${FilterSymbols[spellbook.Filter.S]}]`, `!SpellMaster --UpdateBook ^${spellbook.Name}^ --ParamName ^S^ --ParamValue ^?{Please enter the new filter option|S,${Filters.WithFlag}|No-S,${Filters.WithoutFlag}|No Filter,${Filters.NotApplicable}}^`);
        const mFilter = CreateLink(`[${FilterSymbols[spellbook.Filter.M]}]`, `!SpellMaster --UpdateBook ^${spellbook.Name}^ --ParamName ^M^ --ParamValue ^?{Please enter the new filter option|M,${Filters.WithFlag}|No-M,${Filters.WithoutFlag}|No Filter,${Filters.NotApplicable}}^`);

        const concFilter = CreateLink(`[${FilterSymbols[spellbook.Filter.Concentration]}]`, `!SpellMaster --UpdateBook ^${spellbook.Name}^ --ParamName ^Concentration^ --ParamValue ^?{Please enter the new filter option|Concentration,${Filters.WithFlag}|No-Concentration,${Filters.WithoutFlag}|No Filter,${Filters.NotApplicable}}^`);
        const rituFilter = CreateLink(`[${FilterSymbols[spellbook.Filter.Ritual]}]`, `!SpellMaster --UpdateBook ^${spellbook.Name}^ --ParamName ^Ritual^ --ParamValue ^?{Please enter the new filter option|Ritual,${Filters.WithFlag}|No-Ritual,${Filters.WithoutFlag}|No Filter,${Filters.NotApplicable}}^`);
        const prepFilter = CreateLink(`[${FilterSymbols[spellbook.Filter.Prepared]}]`, `!SpellMaster --UpdateBook ^${spellbook.Name}^ --ParamName ^Prepared^ --ParamValue ^?{Please enter the new filter option|Prepared,${Filters.WithFlag}|No-Prepared,${Filters.WithoutFlag}|No Filter,${Filters.NotApplicable}}^`);
        const slotsFilter = CreateLink(`[${FilterSymbols[spellbook.Filter.Slots]}]`, `!SpellMaster --UpdateBook ^${spellbook.Name}^ --ParamName ^Slots^ --ParamValue ^?{Please enter the new filter option|Slots Remaining,${Filters.WithFlag}|Slots Empty,${Filters.WithoutFlag}|No Filter,${Filters.NotApplicable}}^`);
        
        const searchFilter = CreateLink(`["${spellbook.Filter.Search}"]`, `!SpellMaster --UpdateBook ^${spellbook.Name}^ --ParamName ^Search^ --ParamValue ^?{Please enter the new search string}^`);
        
        text += `<b>Filtering:</b> ${vFilter} V ${sFilter} S ${mFilter} M - ${concFilter} Concentration - ${rituFilter} Ritual - ${prepFilter} Prepared - ${slotsFilter} Slots Remaining - ${searchFilter} Search - Prepared Spells: ${activePrepList.PreparedSpells.length}`;
        text += '<hr>';

        // Spells
        text += '<h2>Spells</h2>';
        text += '<hr>';
        for (let i = 0; i < maxSpellLevel-1; i++) {
            const curSlotLink = CreateLink(`[${spellbook.CurSlots[i-1]}]`, `!SpellMaster --UpdateBook ^${spellbook.Name}^ --UpdateSlot ^${i}^ --ParamName ^Cur^ --ParamValue ^?{Please enter the new current value for Slot Level ${i}}^`);
            const maxSlotLink = CreateLink(`[${spellbook.MaxSlots[i-1]}]`, `!SpellMaster --UpdateBook ^${spellbook.Name}^ --UpdateSlot ^${i}^ --ParamName ^Max^ --ParamValue ^?{Please enter the new maximum value for Slot Level ${i}}^`);
            text += i > 0
                ? `<h3>Level ${i} Spells - ${curSlotLink} / ${maxSlotLink} </h3>`
                : `<h3>Cantrips</h3>`;

            // Perform alpha sort on known spells (in case one got added)
            spellbook.KnownSpells.sort(Sorters.NameAlpha);

            // Print all spells at current level
            spellbook.KnownSpells.forEach((spellInstance) => {
                const spell = SpellDict[spellInstance.Name];
                // Check filtering
                if ((spellbook.Filter.V === Filters.WithFlag && !spell.Components.V) 
                    || (spellbook.Filter.V === Filters.WithoutFlag && spell.Components.V)) {
                    return;
                }
                if ((spellbook.Filter.S === Filters.WithFlag && !spell.Components.S) 
                    || (spellbook.Filter.S === Filters.WithoutFlag && spell.Components.S)) {
                    return;
                }
                if ((spellbook.Filter.M === Filters.WithFlag && !spell.Components.M) 
                    || (spellbook.Filter.M === Filters.WithoutFlag && spell.Components.M)) {
                    return;
                }
                if ((spellbook.Filter.Concentration === Filters.WithFlag && spell.Duration.toLowerCase().indexOf('concentration') === -1) 
                    || (spellbook.Filter.Concentration === Filters.WithoutFlag && spell.Duration.toLowerCase().indexOf('concentration') > -1)) {
                    return;
                }
                if ((spellbook.Filter.Ritual === Filters.WithFlag && !spell.IsRitual) 
                    || (spellbook.Filter.Ritual === Filters.WithoutFlag && spell.IsRitual)) {
                    return;
                }
                if ((spellbook.Filter.Slots === Filters.WithFlag && (spell.Level !== 0 && !spellbook.CurSlots[spell.Level-1])) 
                    || (spellbook.Filter.Slots === Filters.WithoutFlag && !(spell.Level !== 0 && !spellbook.CurSlots[spell.Level-1]))) {
                    return;
                }

                const spellIsPrepared = activePrepList.PreparedSpells.indexOf(spellInstance) > -1;
                if ((spellbook.Filter.Prepared === Filters.WithFlag && !spellIsPrepared) || (spellbook.Filter.Prepared === Filters.WithoutFlag && spellIsPrepared)) {
                    return;
                }

                if (spellbook.Filter.Search.length > 0 
                    && !(spell.Name.includes(spellbook.Filter.Search) 
                        || spell.Components.MDetails.includes(spellbook.Filter.Search) 
                        || spell.Desc.includes(spellbook.Filter.Search) 
                        || spell.Duration.includes(spellbook.Filter.Search) 
                        || (spell.Ability && spell.Ability.includes(spellbook.Filter.Search)) 
                        || spell.Classes.includes(spellbook.Filter.Search))) {
                    return;
                }

                // Verify correct level
                if (spell.Level === i) {
                    // Create the preparation button.
                    let prepButton = spellIsPrepared
                        ? CreateLink('[X]', `!SpellMaster --UpdateBook ^${spellbook.Name}^ --UpdateSpell ^${spellInstance.Name}^ --ParamName ^Prepared^ --ParamValue ^False^`)
                        : CreateLink('[_]', `!SpellMaster --UpdateBook ^${spellbook.Name}^ --UpdateSpell ^${spellInstance.Name}^ --ParamName ^Prepared^ --ParamValue ^True^`);
                    // Cantrips are always prepared
                    prepButton = spell.Level === 0
                        ? '[X]'
                        : prepButton;

                    let tagStr = "";
                    tagStr += spell.IsRitual ? " (R)" : "";
                    tagStr += spell.Duration.toLowerCase().includes('concentration') ? " (C)" : "";

                    const expandedText = spellInstance.IsExpanded 
                        ? CreateLink('[-]', `!SpellMaster --UpdateBook ^${spellbook.Name}^ --UpdateSpell ^${spellInstance.Name}^ --ParamName ^Expanded^ --ParamValue ^False^`)
                        : CreateLink('[+]', `!SpellMaster --UpdateBook ^${spellbook.Name}^ --UpdateSpell ^${spellInstance.Name}^ --ParamName ^Expanded^ --ParamValue ^True^`);

                    text += `<h4>${prepButton} ${spell.Name}${tagStr} ${expandedText}</h4>`;
                    if (spellInstance.IsExpanded) {
                        text += hr;
                        text += `<b>- School:</b> ${spell.School}<br/>`;
                        text += `<b>- Cast Time:</b> ${spell.CastTime}<br/>`;
                        text += `<b>- Range:</b> ${spell.Range}<br/>`;
                        let componentStr = "";
                        log("Components: " + JSON.stringify(spell.Components));
                        componentStr += spell.Components.V ? "V" : "";
                        componentStr += spell.Components.S ? "S" : "";
                        componentStr += spell.Components.M ? "M" : "";
                        componentStr += spell.Components.MDetails ? ` (${spell.Components.MDetails})` : "";
                        text += `<b>- Components:</b> ${componentStr}<br/>`;
                        text += `<b>- Duration:</b> ${spell.Duration}<br/>`;
                        let descStr = spell.Desc
                            .replace("Higher Level:", "<b>At Higher Level:</b>")// This order matters to prevent double-hits
                            .replace("Higher Levels:", "<b>At Higher Level:</b>")
                            .replace("At Higher Level:", "<b>At Higher Level:</b>")
                            .replace("Higher level:", "<b>At Higher Level:</b>")
                            .replace("At higher level:", "<b>At Higher Level:</b>");
                        text += `- <b>Description:</b> ${descStr}<br/>`;
                        text += `- <b>Ability:</b> ${spellInstance.Stat}<br/>`;
                        text += `- <b>Classes:</b> ${spell.Classes}<br/>`;
                        text += br;
                        text += CreateLink('[DELETE]', `!SpellMaster --UpdateBook ^${spellbook.Name}^ --RemoveSpell ^${spell.Name}^ --Confirm ^?{Type Yes to delete ${spell.Name}}^`);
                        text += hr;
                    }
                }
            });
            text += br;
            text += CreateLink('<b>[+]</b>', `!SpellMaster --UpdateBook ^${spellbook.Name}^ --ImportSpell ^?{Please enter the name of the spell you would like to import.}^`);
            text += hr;
        }

        // Preparation Tabs
        text += '<h2>Preparation Lists</h2>';
        for (let i = 0; i < spellbook.PreparationLists.length; i++) {
            const curList = spellbook.PreparationLists[i];
            const isActive = spellbook.ActivePrepList === i;
            const radioButtonActive = isActive
                ? '[X]'
                : '[_]';
            const radioButtonLink = CreateLink(radioButtonActive, `!SpellMaster --UpdateBook ^${spellbook.Name}^ --SetActive ^${i}^`);
            const deletePrepLink = CreateLink('[-]', `!SpellMaster --UpdateBook ^${spellbook.Name}^ --RemovePrepList ^${i}^ --Confirm ^?{Type Yes to delete ${curList.Name}}^`);
            const nameLink = CreateLink(curList.Name, `!SpellMaster --UpdateBook ^${spellbook.Name}^ --RenamePrepList ^${i}^ --ParamValue ^?{Please enter the new name for ${curList.Name}}^`);
            text += `<h4>${radioButtonLink} ${nameLink} (${curList.PreparedSpells.length}) ${deletePrepLink}</h4>`;
        }
        text += br;
        text += CreateLink(`<b>[+]</b>`, `!SpellMaster --UpdateBook ^${spellbook.Name}^ --AddPrepList ^?{Please enter the new preparation list name below.}^`);

        // Print
        //log(text);
        GetHandout(spellbook.Handout).set('notes', text);
    };

    // Parse chat messages
    on('chat:message', (msg) => {
        if (msg.type !== 'api') return;
        if (!msg.content.startsWith(chatTrigger)) return;
        if (!SpellsIndexed) {
            sendChat(scname, "SpellMaster is still indexing spells.  Please wait a few seconds and try again.");
            return;
        }
        
        const argWords = msg.content.split(/\s+/);
        const argParams = msg.content.split('--');

        // Create new spell book handout
        // !SpellMaster --CreateBook ^Tazeka's Spells^ --Owner ^Tazeka Liranov^ --Stat ^Wisdom^ --ImportClass ^Druid^ --Level ^11^
        const createBookTag = '--CreateBook';
        if(argWords.includes(createBookTag)){
            const bookName = GetParamValue(argParams, 'CreateBook');
            const owner = GetParamValue(argParams, 'Owner');
            const stat = GetParamValue(argParams, 'Stat');
            const casterClass = GetParamValue(argParams, 'ImportClass');
            const level = parseInt(GetParamValue(argParams, 'Level')) || 1;

            log("To Configure Handout \"" + bookName + "\" as a spellbook");
            const handout = GetHandout(bookName);
            if(!handout){
                sendChat(scname, `/w ${msg.who} ERROR: No such handout exists!`);
                return;
            }

            // Get spells for class
            let knownSpells = [];
            if (casterClass !== null) {
                for (let i = 0; i < SpellList.length; i++) {
                    const curSpell = SpellList[i];

                    // Do not autopopulate cantrips
                    if (curSpell.Level === 0) {
                        continue;
                    }

                    // Import the spells
                    if (curSpell.Classes.includes(casterClass)) {
                        knownSpells.push({
                            Name: curSpell.Name,
                            IsExpanded: false,
                            Stat: stat
                        });
                    }
                }
            }

            // Get caster type
            const type = GetCasterTypeFromClass(casterClass);

            // Create state entry
            state.SpellMaster[bookName] = {
                IsSpellbook: true,
                Name: bookName,
                Handout: handout.id,
                Stat: stat,
                Owner: owner,
                CasterClass: casterClass,
                PreparationLists: [// An array of arrays of spell names
                    {
                        Name: 'General',
                        PreparedSpells: []// Will be formatted as an array of spell names that are prepared when a certain list is active
                    }
                ],
                Filter: {
                    V: Filters.NotApplicable,
                    S: Filters.NotApplicable,
                    M: Filters.NotApplicable,
                    Concentration: Filters.NotApplicable,
                    Ritual: Filters.NotApplicable,
                    Slots: Filters.WithFlag,
                    Prepared: Filters.NotApplicable,
                    Search: "",
                },
                ActivePrepList: 0,
                KnownSpells: knownSpells,
                CurSlots: GetBaseSpellSlots(type, level),
                MaxSlots: GetBaseSpellSlots(type, level)
            };
            log("Successfully created a new spell list!");
            PrintSpellbook(state.SpellMaster[bookName]);
            sendChat(scname, `/w ${msg.who} Spellbook created.`);
            return;
        }

        // Update existing book
        // !SpellMaster --UpdateBook ^Tazeka's Spellbook^ --ImportSpell ^Moonbeam^
        // !SpellMaster --UpdateBook ^Tazeka's Spellbook^ --RemoveSpell ^Moonbeam^ --Confirm ^Yes^
        // !SpellMaster --UpdateBook ^Tazeka's Spellbook^ --UpdateSpell ^Moonbeam^ --ParamName ^Prepared^ --ParamValue ^True^
        // !SpellMaster --UpdateBook ^Tazeka's Spellbook^ --UpdateSlot ^3^ --ParamName ^Cur^ --ParamValue ^5^
        // !SpellMaster --UpdateBook ^Tazeka's Spellbook^ --UpdateSlot ^3^ --ParamName ^Max^ --ParamValue ^5^
        // !SpellMaster --UpdateBook ^Tazeka's Spellbook^ --ParamName ^V^ --ParamValue ^Filters.WithFlag^
        // !SpellMaster --UpdateBook ^Tazeka's Spellbook^ --AddPrepList ^Offense^
        // !SpellMaster --UpdateBook ^Tazeka's Spellbook^ --RemovePrepList ^0^ --Confirm ^Yes^
        // !SpellMaster --UpdateBook ^Tazeka's Spellbook^ --RenamePrepList ^0^ --ParamValue ^MyNewName^
        const updateBookTag = '--UpdateBook';
        if (argWords.includes(updateBookTag)) {
            // Operation codes
            const bookName = GetParamValue(argParams, 'UpdateBook');
            const importSpell = GetParamValue(argParams, 'ImportSpell');
            const removeSpell = GetParamValue(argParams, 'RemoveSpell');
            const updateSpell = GetParamValue(argParams, 'UpdateSpell');
            const updateSlot = GetParamValue(argParams, 'UpdateSlot');
            const addPrepList = GetParamValue(argParams, 'AddPrepList');
            const setActive = GetParamValue(argParams, 'SetActive');
            const removePrepList = GetParamValue(argParams, 'RemovePrepList');
            const renamePrepList = GetParamValue(argParams, 'RenamePrepList');

            // Parameters
            const paramName = GetParamValue(argParams, 'ParamName');
            const paramValue = GetParamValue(argParams, 'ParamValue');
            const confirm = GetParamValue(argParams, 'Confirm');

            log("Updating book " + bookName);

            // Interaction buttons
            if (importSpell) {
                const spell = SpellDict[importSpell];
                if (!spell) {
                    sendChat(scname, `/w ${msg.who} Invalid spell name to import: ${importSpell}`);
                    return;
                }
                state.SpellMaster[bookName].KnownSpells.push({
                    Name: spell.Name,
                    IsExpanded: false,
                    Stat: state.SpellMaster[bookName].Stat
                });
            } else if (removeSpell) {
                if (confirm !== 'Yes') {
                    return;
                }
                const knownSpells = state.SpellMaster[bookName].KnownSpells;
                let spellDeleted = false;
                for (let i = 0; i < knownSpells.length; i++) {
                    const curSpellInstance = knownSpells[i];
                    if (curSpellInstance.Name === removeSpell) {
                        knownSpells.splice(i,1);
                        spellDeleted = true;
                        break;
                    }
                }
                if (!spellDeleted) {
                    sendChat(scname, `/w ${msg.who} Invalid spell name to delete: ${removeSpell}`);
                    return;
                }
            } else if (updateSpell) {
                const spellbook = state.SpellMaster[bookName];
                if (paramName === 'Prepared') {
                    const prepList = spellbook.PreparationLists[spellbook.ActivePrepList].PreparedSpells;
                    log("Prep List: " + prepList);
                    if (paramValue === 'True') {
                        for(let i = 0; i < spellbook.KnownSpells.length; i++) {
                            const knownSpell = spellbook.KnownSpells[i];
                            if (knownSpell.Name === updateSpell) {
                                log("Adding known spell " + knownSpell + " to prepared list");
                                if (!prepList.includes(knownSpell)) {
                                    prepList.push(knownSpell);
                                }
                                break;
                            }
                        }
                    } else {
                        for(let i = 0; i < spellbook.KnownSpells.length; i++) {
                            const knownSpell = spellbook.KnownSpells[i];
                            if (knownSpell.Name === updateSpell) {
                                const prepIndex = prepList.indexOf(knownSpell);
                                if (prepIndex > -1) {
                                    prepList.splice(prepIndex, 1);
                                }
                                break;
                            }
                        }
                    }
                } else if (paramName === 'Expanded') {
                    for (let i = 0; i < spellbook.KnownSpells.length; i++) {
                        const knownSpell = spellbook.KnownSpells[i];
                        if (knownSpell.Name === updateSpell) {
                            knownSpell.IsExpanded = paramValue === 'True';
                            break;
                        }
                    }
                }
            } else if (updateSlot) {
                const spellbook = state.SpellMaster[bookName];
                const slotIndex = parseInt(updateSlot)-1;
                const newVal = parseInt(paramValue);
                if (paramName === 'Max') {
                    spellbook.MaxSlots[slotIndex] = newVal;
                } else if (paramName === 'Cur') {
                    spellbook.CurSlots[slotIndex] = newVal;
                }
            } else if (addPrepList) {
                const spellbook = state.SpellMaster[bookName];
                for(let i = 0; i < spellbook.PreparationLists.length; i++) {
                    const existingPrepList = spellbook.PreparationLists[i];
                    if (existingPrepList.Name === addPrepList) {
                        sendChat(scname, `/w ${msg.who} Invalid preparation list name ${addPrepList} as it already exists in this spellbook.`);
                        return;
                    }
                }
                spellbook.PreparationLists.push({
                    Name: addPrepList,
                    PreparedSpells: []// Will be formatted as an array of spell names that are prepared when a certain list is active
                });
            } else if (setActive) {
                const spellbook = state.SpellMaster[bookName];
                const activeIndex = parseInt(setActive);
                spellbook.ActivePrepList = activeIndex;
            } else if (removePrepList) {
                if (confirm !== 'Yes') {
                    return;
                }
                const spellbook = state.SpellMaster[bookName];
                const prepIdToRemove = parseInt(removePrepList);
                if (spellbook.ActivePrepList == prepIdToRemove) {
                    sendChat(scname, `/w ${msg.who} Cannot remove currently-active preparation list.`);
                    return;
                }
                spellbook.PreparationLists.splice(parseInt(removePrepList), 1);
            } else if (renamePrepList) {
                const spellbook = state.SpellMaster[bookName];
                const prepIdToRename = parseInt(renamePrepList);

                // Make sure not empty string
                if (paramValue.length === 0) {
                    sendChat(scname, `/w ${msg.who} Cannot set name to empty string.`);
                    return;
                }

                // Names must be exclusive
                for (let i = 0; i < spellbook.PreparationLists.length; i++) {
                    if (spellbook.PreparationLists[i].Name === paramValue && i !== prepIdToRename) {
                        sendChat(scname, `/w ${msg.who} Name already exists.`);
                        return;
                    }
                }

                spellbook.PreparationLists[prepIdToRename].Name = paramValue;
            }
            
            // Filtration
            else if (paramName === 'V') {
                const spellbook = state.SpellMaster[bookName];
                spellbook.Filter.V = parseInt(paramValue);
            } else if (paramName === 'S') {
                const spellbook = state.SpellMaster[bookName];
                spellbook.Filter.S = parseInt(paramValue);
            } else if (paramName === 'M') {
                const spellbook = state.SpellMaster[bookName];
                spellbook.Filter.M = parseInt(paramValue);
            } else if (paramName === 'Ritual') {
                const spellbook = state.SpellMaster[bookName];
                spellbook.Filter.Ritual = parseInt(paramValue);
            } else if (paramName === 'Slots') {
                const spellbook = state.SpellMaster[bookName];
                spellbook.Filter.Slots = parseInt(paramValue);
            } else if (paramName === 'Concentration') {
                const spellbook = state.SpellMaster[bookName];
                spellbook.Filter.Concentration = parseInt(paramValue);
            } else if (paramName === 'Prepared') {
                const spellbook = state.SpellMaster[bookName];
                spellbook.Filter.Prepared = parseInt(paramValue);
            } else if (paramName === 'Search') {
                const spellbook = state.SpellMaster[bookName];
                spellbook.Filter.Search = paramValue;
            }

            PrintSpellbook(state.SpellMaster[bookName]);
            return;
        }

        // Remove existing book
        // !SpellMaster --DeleteBook "Tazeka's Spellbook"
    });

    // Perform garbage collection on orphaned spellbooks
    const PurgeOldSpellbooks = () => {
        // This won't clean up *instantly* but this runs every time, so this will anneal state over time
        for (let bookName in state.SpellMaster) {
            const book = state.SpellMaster[bookName];
            // Don't accidentally delete any non-spellbook properties
            if (book.IsSpellbook) {
                // Attempt to get the handout.
                const handout = GetHandout(book);
                // If it's dead, delete it because the user destroyed it.
                if (handout === null) {
                    log("WARNING: SpellMaster detected orphan book to be delted: " + bookName);
                    delete state.SpellMaster[bookName];
                    break;
                }
            }
        }
    }
    PurgeOldSpellbooks();
});

if (typeof MarkStop != 'undefined') MarkStop('SpellMaster');