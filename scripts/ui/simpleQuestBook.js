import { ActionFormData } from '@minecraft/server-ui';

import { typeIdToDataId, typeIdToID } from '../extensions/typeIds.js'; // Assuming these are still needed for icon mapping
import { slotCoordinates } from '../config/slotCoordinates.js'; // Import the coordinate lookup

/**
 * Defines the custom block & item IDs for the form.
 */
const custom_content = {
	// Corrected duplicate keys and used more specific names
	'custom:skychievments_admin': {
		texture: 'textures/items/skychievments_admin',
		type: 'item'
	},
	'custom:skychievments': {
		texture: 'textures/items/skychievments',
		type: 'item'
	}
};
// Calculate custom items correctly
const number_of_custom_items = Object.values(custom_content).filter(v => v.type === 'item').length;
const custom_content_keys = new Set(Object.keys(custom_content));

class SimpleQuestBook {
    #form; // Holds the ActionFormData instance directly
    // Removed #buttonCount

    constructor() {
        /** @internal */
        this.#form = new ActionFormData();
        // No need to pre-initialize title or buttons based on size
        // Removed #buttonCount initialization
    }

    /**
     * Sets the title of the form.
     * @param {string | RawMessage} text The title text.
     * @returns {this}
     */
    title(text) {
        this.#form.title(text);
        return this;
    }

    /**
     * Sets the body text/texture path for the form.
     * @param {string | RawMessage} bodyText The text or texture path for the form's body.
     * @returns {this}
     */
    body(bodyText) {
        if (bodyText) {
            this.#form.body(bodyText); // Use the parameter directly
        }
        return this;
    }

    /**
     * Adds a button to the form at a specific logical slot.
     * @param {number} slotID The logical slot index for this button (used for coordinate lookup).
     * @param {string | RawMessage} itemName The name of the item/button.
     * @param {(string | RawMessage)[]} itemDesc An array of strings or RawMessages for the item description (lore).
     * @param {string} texture The item ID or texture path for the icon.
     * @param {number} [stackSize=1] The stack size to display.
     * @param {number} [durability=0] The durability percentage (0-99) to display.
     * @param {boolean} [enchanted=false] Whether the item should have an enchantment glint.
     * @returns {this}
     */
    button(slotID, itemName, itemDesc, texture, stackSize = 1, durability = 0, enchanted = false) {
        // Use custom content mapping
        const targetTexture = custom_content_keys.has(texture) ? custom_content[texture]?.texture : texture;
        const ID = typeIdToDataId.get(targetTexture) ?? typeIdToID.get(targetTexture); // Keep ID lookup

        // --- Lookup Offset ---
        const coordinates = slotCoordinates[slotID] ?? '0000:0000'; // Get coordinates or default if slotID is invalid/out of bounds
        const offsetString = `offset::${coordinates}`;
        // --- End Lookup Offset ---

        let buttonRawtext = {
            rawtext: [
                {
                    // Prepend offset, then encode stack and durability
                    text: `${offsetString}stack#${String(Math.min(Math.max(stackSize, 1), 99)).padStart(2, '0')}dur#${String(Math.min(Math.max(durability, 0), 99)).padStart(2, '0')}§r`
                }
            ]
        };

        // Append item name
        if (typeof itemName === 'string') {
            buttonRawtext.rawtext.push({ text: itemName ? `${itemName}§r` : '§r' });
        } else if (typeof itemName === 'object' && itemName.rawtext) {
            buttonRawtext.rawtext.push(...itemName.rawtext, { text: '§r' });
        } else {
            // Add a default empty text if itemName is invalid to avoid errors
             buttonRawtext.rawtext.push({ text: '§r' });
        }

        // Append item description (lore)
        if (Array.isArray(itemDesc) && itemDesc.length > 0) {
            for (const line of itemDesc) {
                 if (typeof line === 'string') {
                    buttonRawtext.rawtext.push({ text: `\n${line}` });
                } else if (typeof line === 'object' && line.rawtext) {
                    // Handle rawtext objects in lore
                    buttonRawtext.rawtext.push({ text: `\n` }, ...line.rawtext);
                }
            }
        }

        // Calculate the icon string/number using the custom item logic
        const iconIdString = (ID === undefined)
                             ? targetTexture // Use texture path directly if ID not found
                             : ((ID + (ID < 256 ? 0 : number_of_custom_items)) * 65536 + (enchanted ? 32768 : 0)).toString();


        // Add the button directly to the form
        this.#form.button(buttonRawtext, iconIdString);

        // Removed button counter increment
        return this;
    }

    /**
     * Shows the form to the player.
     * @param {import('@minecraft/server').Player} player The player to show the form to.
     * @returns {Promise<import('@minecraft/server-ui').ActionFormResponse>}
     */
    show(player) {
        return this.#form.show(player);
    }
}

export { SimpleQuestBook };
