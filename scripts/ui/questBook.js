import { ActionFormData } from '@minecraft/server-ui';
import { typeIdToDataId, typeIdToID } from '../extensions/typeIds.js';

/**
 * Defines the custom block & item IDs for the form.
 * You can reference either a vanilla texture icon, which functions identically to other items...
 * ...or reference a texture path, which removes enchant glint and 3d block render capability.
 */
const inventory_enabled = false;

const custom_content = {
	'custom:item': {
		texture: 'textures/items/skychievments_admin',
		type: 'item'
	},
	'custom:item': {
		texture: 'textures/items/skychievments',
		type: 'item'
	}
};
//Blocks are excluded from the count, as they do not shift vanilla IDs.
const number_of_custom_items = 2;// Object.values(custom_content).filter(v => v.type === 'item').length;
const custom_content_keys = new Set(Object.keys(custom_content));
//Add custom sizes defined in UI
const sizes = new Map([
	['single', ['§c§h§e§s§t§2§7§r', 27]], ['small', ['§c§h§e§s§t§2§7§r', 27]],
	['double', ['§5§c§h§e§s§t§5§4§r', 54]], ['large', ['§5§c§h§e§s§t§5§4§r', 54]],
	['1', ['§c§h§e§s§t§0§1§r', 1]],
	['5', ['§c§h§e§s§t§0§5§r', 5]],
	['9', ['§c§h§e§s§t§0§9§r', 9]],
	['18', ['§c§h§e§s§t§1§8§r', 18]],
	['27', ['§c§h§e§s§t§2§7§r', 27]],
	['36', ['§c§h§e§s§t§3§6§r', 36]],
	['45', ['§c§h§e§s§t§4§5§r', 45]],
	['54', ['§5§c§h§e§s§t§5§4§r', 54]],
	['90', ['§9§c§h§e§s§t§9§0§r', 90]],
	['336', ['§3§3§6§c§h§e§s§t§r', 336]],
	[1, ['§c§h§e§s§t§0§1§r', 1]],
	[5, ['§c§h§e§s§t§0§5§r', 5]],
	[9, ['§c§h§e§s§t§0§9§r', 9]],
	[18, ['§c§h§e§s§t§1§8§r', 18]],
	[27, ['§c§h§e§s§t§2§7§r', 27]],
	[36, ['§c§h§e§s§t§3§6§r', 36]],
	[45, ['§c§h§e§s§t§4§5§r', 45]],
	[54, ['§5§c§h§e§s§t§5§4§r', 54]],
	[90, ['§9§c§h§e§s§t§9§0§r', 90]]
]);

const defaultBackgrounds = new Map([
	['54', 'textures/ui/chestUI_54'],
	['90', 'textures/ui/QuestBackgrounds/chestUI_90_mainpage'],
	['336', 'textures/ui/chestUI_336']
  ]);

  class QuestBook {
	#titleText; #buttonArray; #bodyText;
	constructor(size = 'small') {
		const sizing = sizes.get(size) ?? ['§c§h§e§s§t§2§7§r', 27];
		/** @internal */
		this.#titleText = { rawtext: [{ text: `${sizing[0]}` }] };
		/** @internal */
		this.#bodyText = defaultBackgrounds.get(size)
        /** @internal */
		this.#buttonArray = [];
		for (let i = 0; i < sizing[1]; i++) {
			this.#buttonArray.push(['', undefined])
		};
		this.slotCount = sizing[1];
	}
	title(text) {
        // Keep existing title functionality
        if (typeof (text) === 'string') {
            this.#titleText.rawtext.push({
                text: `${text}`
            })
        } else if (typeof (text) === 'object') {
            if (!text.rawtext) {
                this.#titleText.rawtext.push({
                    text: ''
                })
            }
            else {
                text.rawtext.forEach((obj) => {
                    this.#titleText.rawtext.push(obj)
                })
            }
        }
        else {
            this.#titleText.rawtext.push({
                text: ''
            })
        }
        return this;
    }
    background(texturePath) {
		this.#bodyText = texturePath || this.#bodyText; // Use provided path or keep the default
		return this;
	  }
	button(slot, itemName, itemDesc, texture, stackSize = 1, durability = 0, enchanted = false) {
		const targetTexture = custom_content_keys.has(texture) ? custom_content[texture]?.texture : texture;
		const ID = typeIdToDataId.get(targetTexture) ?? typeIdToID.get(targetTexture);
		let buttonRawtext = {
			rawtext: [
				{
					text: `stack#${String(Math.min(Math.max(stackSize, 1), 99)).padStart(2, '0')}dur#${String(Math.min(Math.max(durability, 0), 99)).padStart(2, '0')}§r`
				}
			]
		};
		if (typeof itemName === 'string') {
			buttonRawtext.rawtext.push({ text: itemName ? `${itemName}§r` : '§r' });
		}
		else if (typeof itemName === 'object' && itemName.rawtext) {
			buttonRawtext.rawtext.push(...itemName.rawtext, { text: '§r' });
		}
		else return;
		if (Array.isArray(itemDesc) && itemDesc.length > 0) {
			for (const obj of itemDesc) {
				if (typeof obj === 'string') {
					buttonRawtext.rawtext.push({ text: `\n${obj}` });
				}
				else if (typeof obj === 'object' && obj.rawtext) {
					buttonRawtext.rawtext.push({ text: `\n` }, ...obj.rawtext);
				}
			}
		}
		this.#buttonArray.splice(Math.max(0, Math.min(slot, this.slotCount - 1)), 1, [
			buttonRawtext,
			ID === undefined ? targetTexture : ((ID + (ID < 256 ? 0 : number_of_custom_items)) * 65536) + (enchanted ? 32768 : 0)
		]);
		return this;
	}
	pattern(pattern, key) {
		for (let i = 0; i < pattern.length; i++) {
			const row = pattern[i];
			for (let j = 0; j < row.length; j++) {
				const letter = row.charAt(j);
				const data = key[letter];
				if (!data) continue;
				const slot = j + i * 9;
				const targetTexture = custom_content_keys.has(data.texture) ? custom_content[data.texture]?.texture : data.texture;
				const ID = typeIdToDataId.get(targetTexture) ?? typeIdToID.get(targetTexture);
				const { stackAmount = 1, durability = 0, itemName, itemDesc, enchanted = false } = data;
				const stackSize = String(Math.min(Math.max(stackAmount, 1), 99)).padStart(2, '0');
				const durValue = String(Math.min(Math.max(durability, 0), 99)).padStart(2, '0');
				let buttonRawtext = {
					rawtext: [{ text: `stack#${stackSize}dur#${durValue}§r` }]
				};
				if (typeof itemName === 'string') {
					buttonRawtext.rawtext.push({ text: `${itemName}§r` });
				}
				else if (itemName?.rawtext) {
					buttonRawtext.rawtext.push(...itemName.rawtext, { text: '§r' });
				}
				else continue;
				if (Array.isArray(itemDesc) && itemDesc.length > 0) {
					for (const obj of itemDesc) {
						if (typeof obj === 'string') {
							buttonRawtext.rawtext.push({ text: `\n${obj}` });
						} else if (obj?.rawtext) {
							buttonRawtext.rawtext.push({ text: `\n`, ...obj.rawtext });
						}
					}
				}
				this.#buttonArray.splice(Math.max(0, Math.min(slot, this.slotCount - 1)), 1, [
					buttonRawtext,
					ID === undefined ? targetTexture : ((ID + (ID < 256 ? 0 : number_of_custom_items)) * 65536) + (enchanted ? 32768 : 0)
				]);
			}
		}
		return this;
	}
	show(player) {
		const form = new ActionFormData().title(this.#titleText);
		if (this.#bodyText) {
				form.body(this.#bodyText);
		}
		this.#buttonArray.forEach(button => {
			form.button(button[0], button[1]?.toString());
		});
		
		if (!inventory_enabled) return form.show(player);
		/** @type {Container} */
		const container = player.getComponent('inventory').container;
		for (let i = 0; i < container.size; i++) {
			const item = container.getItem(i);
			if (!item) continue;
			const typeId = item.typeId;
			const targetTexture = custom_content_keys.has(typeId) ? custom_content[typeId]?.texture : typeId;
			const ID = typeIdToDataId.get(targetTexture) ?? typeIdToID.get(targetTexture);
			const durability = item.getComponent('durability');
			const durDamage = durability ? Math.round((durability.maxDurability - durability.damage) / durability.maxDurability * 99) : 0;
			const amount = item.amount;
			const formattedItemName = typeId.replace(/.*(?<=:)/, '').replace(/_/g, ' ').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
			let buttonRawtext = {
				rawtext: [
					{
						text: `stack#${String(amount).padStart(2, '0')}dur#${String(durDamage).padStart(2, '0')}§r${formattedItemName}`
					}
				]
			};
			const loreText = item.getLore().join('\n');
			if (loreText) buttonRawtext.rawtext.push({ text: loreText });
			const finalID = ID === undefined ? targetTexture : ((ID + (ID < 256 ? 0 : number_of_custom_items)) * 65536);
			form.button(buttonRawtext, finalID.toString());
		}
		return form.show(player);
	}
}

export { QuestBook };