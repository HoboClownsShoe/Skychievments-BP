import * as gt from '@minecraft/server-gametest'
import * as mc from '@minecraft/server'
import FakePlayer from 'fakePlayers/FakePlayers'

gt.register('fakeplayer', 'instance', (test) => {
	console.warn('§uFakeplayer Rework: §rinstance loaded')
	FakePlayer.test = test;
})
	.maxTicks(0x7FFFFFFF)
	.structureName('fakeplayer:server');
	
// Load gametest instance
function LoadInstance() {
	const preInstance = mc.world.getDynamicProperty('FakeplayerPreInstance2');
	const over = mc.world.getDimension('overworld');
	const c = 100;
	
	if (LoadInstance.loaded) return;

	over.runCommand('gametest clearall')
	over.runCommand(`execute positioned ${c} 256 ${c} run gametest run fakeplayer:instance`);
	
	LoadInstance.loaded = true;
}

mc.system.runTimeout(() => {
	LoadInstance();
	
	mc.world.gameRules.doMobSpawning = false;
	mc.world.gameRules.doDayLightCycle = false;
	mc.world.gameRules.doWeatherCycle = false;
	mc.world.setTimeOfDay(12000);
	mc.world.gameRules.randomTickSpeed = 1;
}, 20);