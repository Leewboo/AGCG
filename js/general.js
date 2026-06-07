// ================================
// 武将定义
// ================================
const Generals = [
    {
        id: 'zhaoyun',
        name: '赵云',
        hp: 180,
        atk: 50,
        def: 20,
        mov: 3,
        moveRange: '+3',
        attackRange: '+1',
        quotes: {
            move: ['长枪所向，披靡万里！', '七进七出，何惧之有？'],
            attack: ['胆敢挡我？', '看枪！'],
            skill: ['一身是胆！', '纵马长驱！'],
            kill: ['常胜将军，岂是虚言？', '又下一城！'],
            hurt: ['这点伤，算什么！', '再来！'],
            death: ['主公……云……尽力了……']
        },
        skills: [
            window.Skills.changsheng,
            window.Skills.danyong
        ]
    },
    {
        id: 'guanyu',
        name: '关羽',
        hp: 200,
        atk: 45,
        def: 25,
        mov: 2,
        moveRange: '+2',
        attackRange: '+1',
        quotes: {
            move: ['过五关，斩六将！', '敌将休走！'],
            attack: ['刀下不斩无名之辈！', '看刀！'],
            skill: ['水淹七军！', '吾乃关羽！'],
            kill: ['痛快！', '首级在此！'],
            hurt: ['区区小伤！', '再来！'],
            death: ['大哥……云长……去也……']
        },
        skills: [
            window.Skills.weilin,
            window.Skills.shuiyan
        ]
    },
    {
        id: 'machao',
        name: '马超',
        hp: 190,
        atk: 55,
        def: 18,
        mov: 4,
        moveRange: '+4',
        attackRange: '+1',
        quotes: {
            move: ['铁骑踏破，无人能挡！', '杀！杀！杀！'],
            attack: ['尝尝我的厉害！', '来战！'],
            skill: ['突刺！', '铁骑冲锋！'],
            kill: ['又一个刀下亡魂！', '痛快！'],
            hurt: ['不碍事！', '再来！'],
            death: ['父亲……仇……未报……']
        },
        skills: [
            window.Skills.tieqi,
            window.Skills.tuci
        ]
    }
];

window.Generals = Generals;
window.GENERALS = Generals; // 保持兼容性