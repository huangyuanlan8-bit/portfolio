// All visitor-facing copy is paired [Chinese, English]. No remote services are required.
export const profile = {
  name: ['黄塬岚', 'Yuanlan Huang'],
  email: 'huangyuanlan8@gmail.com',
  intro: ['从人的感受出发，探索产品、交互与服务之间的可能。', 'Exploring the space between people, objects, and the systems that connect them.'],
  statement: ['让看不见的感受，\n成为可以触碰的设计。', 'Making the intangible\nsomething we can feel.'],
  bio: ['我是黄塬岚，就读于重庆大学产品设计专业。我关注健康与照护、具身交互和服务系统，通过用户研究、实体原型与体验验证，把抽象的问题转化为可以讨论、体验和迭代的设计。', 'I’m Yuanlan Huang, a product design undergraduate at Chongqing University. My interests span health and care, embodied interaction, and service systems. Through user research, physical prototyping, and experience evaluation, I turn abstract questions into designs that can be discussed, experienced, and refined.'],
  interests: [
    ['01', '健康与照护', 'Health & care', '从日常处境理解照护需求，连接产品与服务。', 'Understanding care in everyday life, across products and services.'],
    ['02', '具身交互', 'Embodied interaction', '探索光、温度、动作与触感如何影响体验。', 'Exploring how light, warmth, movement, and touch shape experience.'],
    ['03', '研究驱动的设计', 'Research through design', '通过制作提出问题，通过研究修正判断。', 'Asking questions through making, and revising decisions through research.']
  ]
};

export const projects = [
  {
    slug: 'cobreath', name: 'CoBreath', number: '01', year: '2026', color: '#ecd9e4', cover: 'cobreath-cover',
    tag: ['具身交互 / 设计研究', 'Embodied interaction / Design research'],
    headline: ['与一个会“呼吸”的物体，重新感受平静。', 'A small, breathing presence. A moment to recover.'],
    summary: ['探索光、实体起伏与温暖，如何参与压力后的短期恢复体验。', 'Exploring how light, physical movement, and warmth shape short-term recovery after stress.'],
    date: ['2026.04—05', 'Apr–May 2026'], scope: ['多感官原型与混合方法研究', 'Multisensory prototype & mixed-method study'],
    contribution: ['用户调研、实验设计、软硬件连接、原型制作、数据分析与用户测试。', 'User research, experimental design, software–hardware integration, prototyping, data analysis, and user testing.'],
    credit: ['团队研究项目', 'Collaborative research project'],
    overview: ['CoBreath 是一项面向压力后短期恢复的多感官交互设计研究。装置结合呼吸光、实体起伏、柔软触感与温热反馈，探索一个可感知、低打扰的“生命化他者”如何引导人重新关注自身状态。', 'CoBreath is a multisensory interaction design study of short-term recovery after stress. Combining breathing light, physical movement, soft touch, and thermal feedback, it explores how a gentle, life-like presence might help people attend to their internal state.'],
    question: ['当压力任务已经结束，设计如何帮助身体与注意力慢下来？', 'When a stressful task is over, how can design help the body and attention slow down?'],
    research: ['研究结合 MIST 压力诱发任务、2×2 组间实验、体验问卷、皮电监测与半结构化访谈，比较呼吸表达方式与温度反馈的不同组合。生理、主观与访谈材料共同用于理解体验，而非由单一指标定义恢复。', 'The study combines a MIST stress task, a 2×2 between-subjects experiment, questionnaires, electrodermal monitoring, and semi-structured interviews. It compares combinations of breathing expression and thermal feedback, using physiological, self-report, and interview material to understand experience together.'],
    decisions: [
      ['让节律可被看见，也可被触碰', 'A rhythm to see and feel', '将呼吸光与实体起伏作为可比较的呼吸表达方式，考察具身变化与生命感之间的关系。', 'Compare breathing light with physical undulation to explore how embodied change relates to perceived aliveness.'],
      ['把温度作为辅助线索', 'Warmth as a supporting cue', '独立操控温度条件，避免把呼吸表达和温暖混为同一个因素。', 'Vary the thermal condition independently, keeping warmth distinct from the expression of breathing.'],
      ['从原型走向可检验的问题', 'From an object to a testable question', '以实验条件、体验评价与访谈建立证据链，保留不同反馈组合带来的差异。', 'Connect experimental conditions, experience ratings, and interviews, preserving differences between feedback combinations.']
    ],
    media: [
      ['cobreath-making', '原型构造：电路、柔性材料与起伏机构。', 'Prototype construction: electronics, flexible materials, and an undulating mechanism.'],
      ['cobreath-analysis', '原作品集中的汇总分析图；相关关系不等同于因果解释。', 'Aggregate analysis from the original portfolio; association does not establish causation.']
    ],
    finding: ['体验后的主观情绪向较平静、积极的方向移动。实体起伏与更清晰的呼吸表达、较高的生命感评价相联系；温度反馈的作用随表达方式而变化。', 'Self-reported emotion shifted toward a calmer, more positive state after the experience. Physical undulation was associated with clearer breathing expression and higher perceived aliveness; the role of thermal feedback varied with the expression mode.'],
    boundary: ['这些结果针对实验中的短期体验，不能据此推断长期疗效。皮电变化、主观恢复与生命感也不应被视为同一个结果。下一步需要进一步检验反馈机制、使用情境及持续体验。', 'These findings concern short-term experiences in the study and do not establish long-term therapeutic effects. Electrodermal change, subjective recovery, and perceived aliveness are distinct outcomes. Further work should examine feedback mechanisms, use contexts, and repeated experience.'],
    methods: [['实体原型', 'Physical prototyping'], ['2×2 实验', '2×2 experiment'], ['皮电监测', 'EDA'], ['半结构化访谈', 'Interviews']]
  },
  {
    slug: 'care-meal', name: 'Care Meal', number: '02', year: '2026', color: '#f1db84', cover: 'care-cover',
    tag: ['服务系统 / 产品与交互', 'Service system / Product & interaction'],
    headline: ['一餐饭背后，是一整张照护网络。', 'A daily meal. A connected network of care.'],
    summary: ['连接社区医院、食堂、家属与配送，为老年人的日常饮食提供支持。', 'Connecting community healthcare, canteens, families, and delivery around everyday meals for older adults.'],
    date: ['2026.03—05', 'Mar–May 2026'], scope: ['社区健康助餐服务系统', 'Community meal support system'],
    credit: ['产品与服务设计项目', 'Product & service design project'],
    contribution: ['调研、服务系统图、医院端 Web、老人端应用，以及配餐基站与送餐机器人设计。', 'Research, service system mapping, the healthcare web interface, the older-adult app, and the meal station and delivery robot concepts.'],
    overview: ['Care Meal 围绕社区老年人的日常饮食，连接健康建档、营养建议、配餐、配送与餐后反馈。设计涵盖数字界面和实体设备，以不同身体状况、行动能力与家庭照护条件下的用餐需求为出发点。', 'Care Meal connects health records, nutritional guidance, preparation, delivery, and post-meal feedback around older adults’ daily meals. The concept spans digital interfaces and physical equipment, addressing different health conditions, mobility needs, and family care arrangements.'],
    question: ['如何让健康建议，真正走到老年人的餐桌上？', 'How can health guidance find its way to an older person’s table?'],
    research: ['项目通过社区走访、访谈、区位分析与利益相关者梳理，考察沙正街片区内老年居民、社区卫生中心和食堂的联系。设计关注的不只是营养推荐，也包括选餐、取餐与家庭协助的完整路径。', 'Field visits, interviews, location analysis, and stakeholder mapping examined connections between older residents, community healthcare, and canteens in the Shazheng Street area. The design addresses not only nutritional recommendations, but also meal selection, collection, and family assistance.'],
    decisions: [
      ['从单个界面转向服务闭环', 'From an interface to a service loop', '把健康建档、建议、配餐、送达与反馈串联起来，明确不同服务方的职责。', 'Link health records, guidance, preparation, delivery, and feedback, clarifying each provider’s role.'],
      ['保留不同的用餐路径', 'Make room for different routines', '支持堂食、自取与配送，并将家属代订和社区协助纳入服务路径。', 'Support dining in, collection, and delivery, with family ordering and community assistance included in the service journey.'],
      ['让数字信息连接实体配送', 'Connect digital guidance to delivery', '以配餐基站和紧凑型送餐车衔接订单、餐盒交接与领取。', 'Use a meal station and compact delivery vehicle to connect orders, meal handover, and collection.']
    ],
    media: [
      ['care-station', '社区配餐基站设计：从餐食准备到配送交接。', 'Meal station concept: from preparation to delivery handover.'],
      ['care-robot', '送餐机器人产品可视化。', 'Product visualization of the delivery robot concept.']
    ],
    finding: ['形成了跨医院端、老人端与实体配送设备的服务方案，将健康建议与日常用餐过程连接起来。', 'The project produced a service concept spanning healthcare and older-adult interfaces and physical delivery equipment, linking health guidance to everyday meals.'],
    boundary: ['当前展示的是服务与产品设计方案，不能视为已部署系统或已证实的健康改善。后续应以真实订单任务检验操作负担，并验证社区运营、设备交接与人工协助流程。', 'The work shown is a service and product concept, rather than evidence of deployment or improved health outcomes. Next steps include testing ordering tasks and examining community operations, equipment handover, and assisted use.'],
    methods: [['社区走访', 'Field research'], ['利益相关者地图', 'Stakeholder mapping'], ['服务蓝图', 'Service blueprint'], ['产品与界面', 'Product & UI']]
  },
  {
    slug: 'dotheal', name: 'DoTheal', number: '03', year: '2026', color: '#cbd6df', cover: 'dotheal-cover',
    tag: ['智能硬件 / 产品与交互', 'Smart hardware / Product & interaction'],
    headline: ['把复杂的操作，转化为清楚的引导。', 'Turning a complex procedure into a guided experience.'],
    summary: ['围绕手持揿针设备，探索硬件、引导反馈与应用流程的协同。', 'Exploring a handheld press-needle applicator through hardware, guidance feedback, and an accompanying app.'],
    date: ['2026.01—03', 'Jan–Mar 2026'], scope: ['手持设备与配套应用概念', 'Handheld device & companion app concept'],
    credit: ['产品与交互设计项目', 'Product & interaction design project'],
    contribution: ['产品定义、结构机构、设备端界面与应用流程设计。', 'Product definition, mechanical structure, the device interface, and app flows.'],
    overview: ['Dotheal 以运动后的自主康复需求为出发点，提出手持揿针贴敷器与配套应用的系统概念。设计将身体区域选择、定位引导、贴敷和记录组织为连续流程，并探索触觉反馈在定位过程中的作用。', 'Dotheal is a handheld press-needle applicator and companion app concept motivated by self-managed recovery after sport. It connects body-region selection, location guidance, application, and recording into a continuous flow, exploring tactile feedback during positioning.'],
    question: ['当操作依赖专业知识，产品如何提供清晰、连续的反馈？', 'How can a product guide a procedure that depends on specialist knowledge?'],
    research: ['设计材料将穴位定位难、学习门槛与操作空间限制作为切入点。通过使用故事板、结构推演和界面流程，梳理用户从准备设备到完成操作所需的信息与反馈。', 'The design materials identify difficult acupoint location, a learning barrier, and spatial constraints as starting points. Storyboarding, mechanical exploration, and interface flows examine the information and feedback needed from preparation to completion.'],
    decisions: [
      ['分配应用与设备的任务', 'Give app and device distinct jobs', '应用承担扫描、方案与记录的概念流程，设备集中展示当前步骤和状态。', 'The app concept handles scanning, planning, and records, while the device focuses on the current step and status.'],
      ['把定位反馈带到手中', 'Put guidance in the hand', '以四向振动反馈表达微调方向，减少用户反复查看不同屏幕的需要。', 'Explore four-direction vibration cues for fine adjustment, reducing the need to alternate attention between screens.'],
      ['让补充与收纳成为完整体验', 'Design beyond the main action', '围绕替换芯、底盖、充电与包装组织维护流程，形成较完整的产品系统。', 'Include replacement cartridges, the cap, charging, and packaging as part of the product system.']
    ],
    media: [
      ['dotheal-sketch', '早期草图与形态探索。', 'Early sketches and form exploration.'],
      ['dotheal-mechanism', '按压机构设计示意。', 'Press mechanism design study.'],
      ['dotheal-colors', '不同配色的设备可视化。', 'Device visualizations in different finishes.'],
      ['dotheal-packaging', '设备、底座与耗材的包装设计。', 'Packaging for the device, charging dock, and consumables.']
    ],
    video: 'dotheal-film.mp4',
    finding: ['完成了设备形态、按压结构、设备端状态界面及配套应用流程的设计表达。相关便携式手持揿针器成果获得发明专利授权。', 'The work develops the device form, press mechanism, device-state interface, and companion app flows. A related portable handheld press-needle applicator received an invention patent grant.'],
    boundary: ['专利与设计可视化不代表定位精度、临床疗效或医疗安全已获得验证。扫描与个性化方案在此作为概念流程展示，后续需要专业协作与独立验证。', 'A patent and design visualizations do not establish positioning accuracy, clinical efficacy, or medical safety. Scanning and personalization are shown as concept flows and require specialist collaboration and independent validation.'],
    methods: [['产品定义', 'Product definition'], ['结构设计', 'Mechanism design'], ['触觉引导', 'Haptic guidance'], ['交互流程', 'Interaction flows']]
  },
  {
    slug: 'dragon', name: 'Oracle of Dragon', number: '04', year: '2025—26', color: '#c6bcde', cover: 'dragon-cover',
    tag: ['交互装置 / 机械原型', 'Interactive installation / Physical prototype'],
    headline: ['把一句回应，变成一场可以触碰的仪式。', 'A symbolic answer becomes a tangible ritual.'],
    summary: ['结合龙文化、机械动作与生成式回应，探索不确定情境中的仪式体验。', 'Dragon symbolism, mechanical movement, and generated responses meet in a ritual for uncertainty.'],
    date: ['2025.11—2026.01', 'Nov 2025–Jan 2026'], scope: ['创意机构设计 / 团队项目', 'Creative mechanism design / Team project'],
    credit: ['团队装置项目', 'Collaborative installation project'], contribution: ['概念提出、用户调研、故事板、交互流程设计、硬件连接、原型制作，以及外观设计与制作。', 'Concept development, user research, storyboarding, interaction flows, hardware integration, prototyping, and exterior design and fabrication.'],
    overview: ['龙说将传统求签的等待、回应与留存转化为机械交互体验。用户提出问题，装置通过睁眼、灯光、龙冠摆动和声音形成反馈，并以可保存的实体签文结束仪式。', 'Oracle of the Dragon translates the waiting, response, and keepsake of a fortune ritual into a mechanical interaction. A question is met with opening eyes, light, crown movement, and sound; a printed slip completes the experience.'],
    question: ['人面对不确定时，所需要的回应一定是一个确定答案吗？', 'When facing uncertainty, must a meaningful response be a definite answer?'],
    research: ['项目从龙文化、求签流程与年轻人的象征性解释行为出发，将“提出困惑—等待回应—解释签文—保留实体”作为交互叙事。设计关注回应感与自我投射，而非预测结果的准确性。', 'The project examines dragon symbolism, fortune rituals, and symbolic interpretation. Its interaction follows a question, a waiting period, an answer to interpret, and a physical keepsake. The focus is responsiveness and personal interpretation, rather than predictive accuracy.'],
    decisions: [
      ['让回应具备身体', 'Give the response a body', '以睁眼、光、声音与持续运动构成多模态反馈，让等待过程也成为体验的一部分。', 'Use eyes, light, sound, and sustained movement as multimodal feedback, making waiting part of the experience.'],
      ['根据制作反馈调整材料', 'Let making reshape material choices', '初期黏土在弯折和连接处易断裂，后续改用可塑形的柔性包覆材料。', 'Early clay forms broke at bends and connections, prompting a shift to flexible, shapeable wrapping materials.'],
      ['让数字回应留下实体', 'Leave a physical trace', '将生成的短签文传递给热敏打印模块，形成可以携带与回看的纪念物。', 'Send the generated short response to a thermal printer, producing a keepsake to carry and revisit.']
    ],
    media: [
      ['dragon-prototype', '制作完成的实体装置。', 'The completed physical installation.'],
      ['dragon-making', '材料尝试、机构制作与反馈设计过程。', 'Material trials, mechanical construction, and feedback design.']
    ],
    finding: ['完成了包含机械动作、灯光、声音与签文输出的装置原型，呈现从提问到获得实体回应的交互路径。', 'The installation prototype combines mechanical movement, lighting, sound, and printed responses to demonstrate an interaction from question to tangible answer.'],
    boundary: ['当前材料支持制作过程与交互原型展示，尚不能证明焦虑缓解效果。后续可研究用户如何理解签文、等待时长如何影响体验，以及回应的表述边界。', 'The materials support the making process and interaction prototype, rather than evidence of anxiety reduction. Further work could examine how people interpret slips, how waiting affects experience, and how responses should be phrased.'],
    methods: [['仪式研究', 'Ritual exploration'], ['Arduino', 'Arduino'], ['机械结构', 'Mechanical prototyping'], ['多模态反馈', 'Multimodal feedback']]
  }
];

projects.sort((a,b)=>['care-meal','cobreath','dotheal','dragon'].indexOf(a.slug)-['care-meal','cobreath','dotheal','dragon'].indexOf(b.slug));
projects.forEach((p,i)=>p.number=String(i+1).padStart(2,'0'));
projects.push({slug:'scent-chongqing',name:'Scent Chongqing',number:'05',year:'—',color:'#e8e8e5',cover:'scent-cover',placeholder:true,
 tag:['项目说明待补充','Project story to be added'],
 summary:['项目封面与视频已导入；研究过程、个人职责和项目说明待补充。','Cover and film are available. Research process, individual contributions, and project story are to be added.']});
