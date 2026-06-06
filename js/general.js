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
        skills: [
            window.Skills.changSheng,
            window.Skills.danYong
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
        skills: [
            window.Skills.weiLin,
            window.Skills.shuiYan
        ]
    },
    {
        id: 'debug1', name: '调试将甲', hp: 100, atk: 20, def: 10, mov: 3,
        moveRange: '+3', attackRange: '+1',
        skills: [window.Skills.testDmg]
    },
    {
        id: 'debug2', name: '调试将乙', hp: 110, atk: 22, def: 12, mov: 2,
        moveRange: '+2', attackRange: '+1',
        skills: [window.Skills.testDmg]
    },
    {
        id: 'debug3', name: '调试将丙', hp: 90, atk: 25, def: 8, mov: 3,
        moveRange: '+3', attackRange: '+1',
        skills: [window.Skills.testDmg]
    },
    {
        id: 'debug4', name: '调试将丁', hp: 120, atk: 18, def: 15, mov: 2,
        moveRange: '+2', attackRange: '+1',
        skills: [window.Skills.testDmg]
    },
    {
        id: 'debug5', name: '调试将戊', hp: 95, atk: 24, def: 11, mov: 3,
        moveRange: '+3', attackRange: '+1',
        skills: [window.Skills.testDmg]
    },
    {
        id: 'debug6', name: '调试将己', hp: 105, atk: 19, def: 14, mov: 3,
        moveRange: '+3', attackRange: '+1',
        skills: [window.Skills.testDmg]
    },
    {
        id: 'debug7', name: '调试将庚', hp: 85, atk: 28, def: 9, mov: 4,
        moveRange: '+4', attackRange: '+1',
        skills: [window.Skills.testDmg]
    },
    {
        id: 'debug8', name: '调试将辛', hp: 115, atk: 17, def: 18, mov: 2,
        moveRange: '+2', attackRange: '+1',
        skills: [window.Skills.testDmg]
    },
    {
        id: 'debug9', name: '调试将壬', hp: 100, atk: 21, def: 13, mov: 3,
        moveRange: '+3', attackRange: '+1',
        skills: [window.Skills.testDmg]
    }
];

window.Generals = Generals;
window.GENERALS = Generals;
