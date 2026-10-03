############################################################
INTERACTION i-00a50fa3
  conditionalPlayback: null
  TRIGGER: wf:hover { controlType="standard" }
  TRIGGER: wf:hover { control="reverseFlipEase"; controlType="standard"; pluginConfig={"type":"mouseleave","hover":"each"} }
  TIMELINE t-235027ae  (2 actions)
    pos=0 dur=0.36 ease=- tt=2
      targets: wf:class:["text-button-normal-text"] within filterBy=["wf:trigger-only",""]
      splitText: {"type":"chars"}
      props: {"wf:transform":{"y":["0%","-100%"],"scale":[1,0.4]}}
    pos=0 dur=0.36 ease=- tt=2
      targets: wf:class:["text-button-hover-text"] within filterBy=["wf:trigger-only",""]
      splitText: {"type":"chars"}
      props: {"wf:transform":{"y":["0%","-100%"],"scale":[0.4,1]}}
############################################################
INTERACTION i-34e05c93
  conditionalPlayback: null
  TRIGGER: wf:hover { controlType="standard" }
  TRIGGER: wf:hover { control="reverseFlipEase"; controlType="standard"; pluginConfig={"type":"mouseleave","hover":"each"} }
  TIMELINE t-7b5113cd  (4 actions)
    pos=0 dur=0.25 ease=- tt=2
      targets: wf:class:["button-normal-text"] none
      splitText: {"type":"chars"}
      props: {"wf:transform":{"y":["0%","-100%"]}}
    pos=0 dur=0.25 ease=- tt=2
      targets: wf:class:["button-normal-text"] none
      splitText: {"type":"chars"}
      props: {"wf:transform":{"y":["100%","0%"]}}
    pos=0 dur=0.25 ease=- tt=2
      targets: wf:attribute:"[button-icon-anin-one=\"ture\"]" none
      props: {"wf:transform":{"rotation":["0deg","45deg"]}}
    pos=0 dur=0.25 ease=- tt=2
      targets: wf:attribute:"[button-icon-anin-two=\"ture\"]" none
      props: {"wf:transform":{"rotation":["0deg","-45deg"]}}
############################################################
INTERACTION i-e07f66d1
  conditionalPlayback: null
  TRIGGER: wf:click { control="togglePlayReverseFlipEase"; controlType="standard" }
  TIMELINE t-f2b5701b  (2 actions)
    pos=0 dur=0.35 ease=- tt=2
      targets: wf:class:["faq-toggle-content"] within filterBy=["wf:trigger-only",""]
      props: {"wf:transform":{"height":["0px","auto"]}}
    pos=0 dur=0.35 ease=- tt=2
      targets: wf:class:["faq-item-icon"] within filterBy=["wf:trigger-only",""]
      props: {"wf:transform":{"rotation":["0deg","225deg"]}}
############################################################
INTERACTION i-eb2d3c5d
  conditionalPlayback: null
  TRIGGER: wf:load { control="play"; controlType="load" }
  TIMELINE t-775def8a  (2 actions)
    pos=0 dur=40 ease=- tt=2
      targets: wf:attribute:"[marquee-slide-left=\"true\"]" none
      props: {"wf:transform":{"x":["0%","-100%"]}}
    pos=0 dur=40 ease=- tt=2
      targets: wf:attribute:"[marquee-slide-right=\"true\"]" none
      props: {"wf:transform":{"x":["-100%","0%"]}}
############################################################
INTERACTION i-fef9e431
  conditionalPlayback: null
  TRIGGER: wf:mouse-move { controlType="continuous"; pluginConfig={"restingState":{"x":50,"y":50},"smoothness":90} }
  TIMELINE t-d4136326  (1 actions)
    pos=0 dur=1 ease=- tt=2
      targets: wf:class:["icon.icon-button-icon"] within filterBy=["wf:trigger-only",""]
      props: {"wf:transform":{"x":["-8px","8px"]}}
  TIMELINE t-b461b434  (1 actions)
    pos=0 dur=1 ease=- tt=2
      targets: wf:class:["icon.icon-button-icon"] within filterBy=["wf:trigger-only",""]
      props: {"wf:transform":{"y":["-8px","8px"]}}
  TIMELINE t-6a067e74  (0 actions)
############################################################
INTERACTION i-c8a0a373
  conditionalPlayback: null
  TRIGGER: wf:click { control="togglePlayReverseFlipEase"; controlType="standard" }
  TIMELINE t-a4a0eafc  (5 actions)
    pos=0 dur=0 ease=- tt=3
      targets: wf:class:["nav-menu-wrap"] none
      props: {"wf:transform":{"display":[null,"block"]}}
    pos=0 dur=0 ease=- tt=2
      targets: wf:inst:["24ca57b6-65bd-90cf-29f6-88f79a1acfa1","24ca57b6-65bd-90cf-29f6-88f79a1acfb1"] none
      props: {"wf:transform":{"x":["0px","0px"],"y":["0px","6px"],"rotation":["0deg","45deg"]}}
    pos=0 dur=0 ease=- tt=2
      targets: wf:inst:["24ca57b6-65bd-90cf-29f6-88f79a1acfa1","24ca57b6-65bd-90cf-29f6-88f79a1acfb3"] none
      props: {"wf:transform":{"x":["0px","0px"],"y":["0px","-10px"],"rotation":["0deg","-45deg"]}}
    pos=0 dur=0 ease=- tt=2
      targets: wf:inst:["24ca57b6-65bd-90cf-29f6-88f79a1acfa1","24ca57b6-65bd-90cf-29f6-88f79a1acfb2"] none
      props: {"wf:transform":{"opacity":["100%","0%"]}}
    pos=0 dur=0 ease=- tt=1
      targets: wf:class:["menu-wrapper"] none
      props: {"wf:transform":{"opacity":["0%",null],"y":["50px",null]}}
############################################################
INTERACTION i-828746a1
  conditionalPlayback: null
  TRIGGER: wf:load { control="play"; controlType="load" }
  TIMELINE t-b6a25db9  (11 actions)
    pos=0 dur=4 ease=- tt=2
      targets: wf:attribute:"[contain-left-move-child=\"ture\"]" none
      props: {"wf:transform":{"y":["0px","40px"]}}
    pos=0 dur=4 ease=- tt=2
      targets: wf:attribute:"[contain-left-move-child=\"ture\"]" none
      props: {"wf:transform":{"y":["40px","0px"]}}
    pos=0 dur=4 ease=- tt=2
      targets: wf:attribute:"[contain-right-move-child=\"ture\"]" none
      props: {"wf:transform":{"y":["0px","-40px"]}}
    pos=0 dur=4 ease=- tt=2
      targets: wf:attribute:"[contain-right-move-child=\"ture\"]" none
      props: {"wf:transform":{"y":["-40px","0px"]}}
    pos=0 dur=1.8 ease=- tt=2
      targets: wf:attribute:"[love-child=\"ture\"]" none
      props: {"wf:transform":{"scale":[0.8,1]}}
    pos=0 dur=1.8 ease=- tt=2
      targets: wf:attribute:"[love-child=\"ture\"]" none
      props: {"wf:transform":{"scale":[1,0.8]}}
    pos=0 dur=1.8 ease=- tt=2
      targets: wf:attribute:"[love-child=\"ture\"]" none
      props: {"wf:transform":{"scale":[0.8,1]}}
    pos=0 dur=1.8 ease=- tt=2
      targets: wf:attribute:"[love-child=\"ture\"]" none
      props: {"wf:transform":{"scale":[1,0.8]}}
    pos=0 dur=1.8 ease=- tt=2
      targets: wf:attribute:"[love-child=\"ture\"]" none
      props: {"wf:transform":{"scale":[0.8,1]}}
    pos=0 dur=4 ease=- tt=2
      targets: wf:attribute:"[text-box-child=\"ture\"]" none
      props: {"wf:transform":{"rotation":["7deg","0deg"]}}
    pos=0 dur=4 ease=- tt=2
      targets: wf:attribute:"[text-box-child=\"ture\"]" none
      props: {"wf:transform":{"rotation":["0deg","7deg"]}}
############################################################
INTERACTION i-230919d6
  conditionalPlayback: null
  TRIGGER: wf:hover { controlType="standard" }
  TRIGGER: wf:hover { control="reverseFlipEase"; controlType="standard"; pluginConfig={"type":"mouseleave","hover":"each"} }
  TIMELINE t-7fa73056  (1 actions)
    pos=0 dur=0.6 ease=- tt=2
      targets: wf:attribute:"[card-image-hover-child=\"ture\"]" within filterBy=["wf:trigger-only",""]
      props: {"wf:transform":{"scale":[1,1.15]}}
############################################################
INTERACTION i-a76c4835
  conditionalPlayback: null
  TRIGGER: wf:load { control="play"; controlType="load" }
  TIMELINE t-0e4da051  (1 actions)
    pos=0 dur=18 ease=- tt=2
      targets: wf:attribute:"[marku-slide=\"ture\"]" none
      props: {"wf:transform":{"x":["0%","-100%"]}}
############################################################
INTERACTION i-f827d08f
  conditionalPlayback: null
  TRIGGER: wf:load { control="play"; controlType="load" }
  TIMELINE t-0552a309  (2 actions)
    pos=0 dur=2 ease=- tt=2
      targets: wf:attribute:"[move-opacty=\"ture\"]" none
      props: {"wf:transform":{"opacity":["100%","0%"],"scale":[1,0.5]}}
    pos=0 dur=2 ease=- tt=2
      targets: wf:attribute:"[move-opacty=\"ture\"]" none
      props: {"wf:transform":{"opacity":["0%","100%"],"scale":[0.5,1]}}
############################################################
INTERACTION i-77456e03
  conditionalPlayback: null
  TRIGGER: wf:load { control="play"; controlType="load" }
  TIMELINE t-ece8992f  (2 actions)
    pos=0 dur=3 ease=- tt=2
      targets: wf:attribute:"[group-fast-move=\"ture\"]" none
      props: {"wf:transform":{"scale":[0.7,1]}}
    pos=0 dur=3 ease=- tt=2
      targets: wf:attribute:"[group-fast-move=\"ture\"]" none
      props: {"wf:transform":{"scale":[1,0.7]}}
############################################################
INTERACTION i-8df5c621
  conditionalPlayback: null
  TRIGGER: wf:load { control="play"; controlType="load" }
  TIMELINE t-54083a40  (2 actions)
    pos=0 dur=3 ease=- tt=2
      targets: wf:attribute:"[group-secend-move=\"ture\"]" none
      props: {"wf:transform":{"scale":[1,0.7]}}
    pos=0 dur=3 ease=- tt=2
      targets: wf:attribute:"[group-secend-move=\"ture\"]" none
      props: {"wf:transform":{"scale":[0.7,1]}}
############################################################
INTERACTION i-5b0b31d1
  conditionalPlayback: null
  TRIGGER: wf:scroll { controlType="scroll"; scrollTriggerConfig={"clamp":false,"start":"top 92%","end":"bottom top","scrub":null,"enter":"play","leave":"none","enterBack":"none","leaveBack":"none"} }
  TIMELINE t-b4170d02  (1 actions)
    pos=0 dur=0.45 ease=- tt=2
      targets: wf:attribute:"[group-fade-up-item=\"true\"]" within filterBy=["wf:trigger-only",""]
      props: {"wf:transform":{"y":["60px","0px"],"opacity":["0%","100%"]}}
############################################################
INTERACTION i-6994eb39
  conditionalPlayback: null
  TRIGGER: wf:scroll { controlType="scroll"; scrollTriggerConfig={"clamp":false,"start":"top 92%","end":"bottom top","scrub":null,"enter":"play","leave":"none","enterBack":"none","leaveBack":"none"} }
  TIMELINE t-efff5d92  (1 actions)
    pos=0 dur=0 ease=- tt=2
      targets: wf:attribute:"[group-fedup-move=\"ture\"]" within filterBy=["wf:trigger-only",""]
      props: {"wf:transform":{"y":["100px","0px"],"opacity":["0%","100%"]}}
############################################################
INTERACTION i-612af6c6
  conditionalPlayback: [{"type":"breakpoint","behavior":"dont-animate","breakpoints":["main"]}]
  TRIGGER: wf:scroll { controlType="scroll"; scrollTriggerConfig={"clamp":true,"start":"top bottom","end":"bottom top","scrub":null,"enter":"play","leave":"none","enterBack":"none","leaveBack":"none"} }
  TIMELINE t-ce7e5e84  (1 actions)
    pos=0 dur=0.7 ease=- tt=2
      targets: wf:attribute:"[group-fedup-phone=\"ture\"]" within filterBy=["wf:trigger-only",""]
      props: {"wf:transform":{"y":["100px","0px"]}}
############################################################
INTERACTION i-372c70f6
  conditionalPlayback: null
  TRIGGER: wf:scroll { controlType="scroll"; scrollTriggerConfig={"clamp":false,"start":"top 92%","end":"bottom top","scrub":null,"enter":"play","leave":"none","enterBack":"none","leaveBack":"none"} }
  TIMELINE t-af1e2fb3  (1 actions)
    pos=0 dur=0.45 ease=- tt=1
      targets: wf:trigger-only:"" none
      props: {"wf:transform":{"opacity":["0%",null],"y":["60px",null]}}
############################################################
INTERACTION i-179b06d0
  conditionalPlayback: null
  TRIGGER: wf:scroll { controlType="scroll"; scrollTriggerConfig={"clamp":false,"start":"top 92%","end":"bottom top","scrub":null,"enter":"play","leave":"none","enterBack":"none","leaveBack":"none"} }
  TIMELINE t-84fe2684  (1 actions)
    pos=0 dur=0.45 ease=- tt=1
      targets: wf:trigger-only:"" none
      props: {"wf:transform":{"opacity":["0%",null]}}
############################################################
INTERACTION i-8181fa36
  conditionalPlayback: null
  TRIGGER: wf:click { controlType="standard" }
  TIMELINE t-e78f85d1  (1 actions)
    pos=0 dur=0.2 ease=- tt=2
      targets: wf:trigger-only:"" none
      props: {"wf:transform":{"scale":[1,0.9]}}
############################################################
INTERACTION i-7c519911
  conditionalPlayback: null
  TRIGGER: wf:click { control="togglePlayReverse"; controlType="standard" }
  TIMELINE t-0c724ebe  (2 actions)
    pos=0 dur=0 ease=- tt=2
      targets: wf:class:["accordion-item-body-wrapper"] within filterBy=["wf:trigger-only",""]
      props: {"wf:transform":{"height":["0px","auto"]}}
    pos=0 dur=0 ease=- tt=-
      targets: wf:class:["accordion-item-title-icon"] within filterBy=["wf:trigger-only",""]
      props: {"wf:transform":{"rotation":[null,"180deg"]}}
############################################################
INTERACTION i-b3689748
  conditionalPlayback: null
  TRIGGER: wf:load { control="play"; speed=1; controlType="load" }
  TIMELINE t-41c4b10c  (4 actions)
    pos=0 dur=3 ease=- tt=2
      targets: wf:class:["agency-hero-image-wrap.one"] none
      props: {"wf:transform":{"rotation":["0deg","20deg"]}}
    pos=0 dur=3 ease=- tt=2
      targets: wf:class:["agency-hero-image-wrap.one"] none
      props: {"wf:transform":{"rotation":["20deg","0deg"]}}
    pos=0 dur=3 ease=- tt=2
      targets: wf:class:["agency-hero-image-wrap.two"] none
      props: {"wf:transform":{"y":["0px","-20px"]}}
    pos=0 dur=3 ease=- tt=2
      targets: wf:class:["agency-hero-image-wrap.two"] none
      props: {"wf:transform":{"y":["-20px","0px"]}}
############################################################
INTERACTION i-b24a6ed3
  conditionalPlayback: null
  TRIGGER: wf:load { control="play"; controlType="load" }
  TIMELINE t-b1014af3  (1 actions)
    pos=0 dur=4 ease=- tt=2
      targets: wf:class:["hero-intro-meddle-bg-image"] none
      props: {"wf:transform":{"rotation":["-360deg","0deg"]}}
############################################################
INTERACTION i-09ce63a3
  conditionalPlayback: null
  TRIGGER: wf:load { control="play"; controlType="load" }
  TIMELINE t-79a8569c  (2 actions)
    pos=0 dur=1.5 ease=- tt=2
      targets: wf:attribute:"[zome-in-zom-out=\"ture\"]" none
      props: {"wf:transform":{"scale":[0.8,1.1]}}
    pos=0 dur=1.5 ease=- tt=2
      targets: wf:attribute:"[zome-in-zom-out=\"ture\"]" none
      props: {"wf:transform":{"scale":[1.1,0.8]}}
############################################################
INTERACTION i-fe0da1ce
  conditionalPlayback: null
  TRIGGER: wf:load { control="play"; controlType="load" }
  TIMELINE t-10e0cf06  (2 actions)
    pos=0 dur=3 ease=- tt=2
      targets: wf:attribute:"[move-left-right=\"ture\"]" none
      props: {"wf:transform":{"x":["0px","40px"]}}
    pos=0 dur=3 ease=- tt=2
      targets: wf:attribute:"[move-left-right=\"ture\"]" none
      props: {"wf:transform":{"x":["40px","0px"]}}
############################################################
INTERACTION i-80217074
  conditionalPlayback: null
  TRIGGER: wf:scroll { controlType="scroll"; scrollTriggerConfig={"clamp":true,"start":"top bottom","end":"bottom top","scrub":null,"enter":"play","leave":"none","enterBack":"none","leaveBack":"none"} }
  TIMELINE t-5bfbc4bc  (5 actions)
    pos=0 dur=0.6 ease=- tt=2
      targets: wf:class:["text-title-box.item-one"] within filterBy=["wf:trigger-only",""]
      props: {"wf:transform":{"y":["-100px","0px"]}}
    pos=0 dur=0.6 ease=- tt=2
      targets: wf:class:["text-title-box.item-two"] within filterBy=["wf:trigger-only",""]
      props: {"wf:transform":{"y":["-100px","0px"]}}
    pos=0 dur=0.6 ease=- tt=2
      targets: wf:class:["text-title-box.item-three"] within filterBy=["wf:trigger-only",""]
      props: {"wf:transform":{"y":["-150px","0px"]}}
    pos=0 dur=0.6 ease=- tt=2
      targets: wf:class:["text-title-box.item-four"] within filterBy=["wf:trigger-only",""]
      props: {"wf:transform":{"y":["-230px","0px"]}}
    pos=0 dur=0.6 ease=- tt=2
      targets: wf:class:["text-title-box.item-five"] within filterBy=["wf:trigger-only",""]
      props: {"wf:transform":{"y":["-230px","0px"]}}
############################################################
INTERACTION i-07015591
  conditionalPlayback: null
  TRIGGER: wf:hover { controlType="standard" }
  TRIGGER: wf:hover { control="reverseFlipEase"; controlType="standard"; pluginConfig={"type":"mouseleave","hover":"each"} }
  TIMELINE t-50a82a8a  (1 actions)
    pos=0 dur=0.6 ease=- tt=2
      targets: wf:attribute:"[hover-child=\"ture\"]" within filterBy=["wf:trigger-only",""]
      props: {"wf:transform":{"scale":[1,0.8]}}
############################################################
INTERACTION i-edb34fd9
  conditionalPlayback: [{"type":"breakpoint","behavior":"dont-animate","breakpoints":["medium","small","tiny"]}]
  TRIGGER: wf:scroll { controlType="scroll"; scrollTriggerConfig={"clamp":true,"start":"top top","end":"bottom bottom","scrub":0.8,"enter":"play","leave":"none","enterBack":"none","leaveBack":"none"} }
  TIMELINE t-47bfa973  (4 actions)
    pos=0 dur=1 ease=- tt=2
      targets: wf:class:["box-one"] within filterBy=["wf:trigger-only",""]
      props: {"wf:transform":{"x":["500px","100px"],"y":["200px","0px"]}}
    pos=0 dur=1 ease=- tt=2
      targets: wf:class:["box-two"] within filterBy=["wf:trigger-only",""]
      props: {"wf:transform":{"x":["-500px","-100px"],"y":["200px","0px"]}}
    pos=0 dur=1 ease=- tt=2
      targets: wf:class:["box-three"] within filterBy=["wf:trigger-only",""]
      props: {"wf:transform":{"x":["450px","200px"],"y":["-200px","0px"]}}
    pos=0 dur=1 ease=- tt=2
      targets: wf:class:["box-four"] within filterBy=["wf:trigger-only",""]
      props: {"wf:transform":{"x":["-500px","-200px"],"y":["-150px","0px"]}}
############################################################
INTERACTION i-4f6ebce5
  conditionalPlayback: null
  TRIGGER: wf:load { control="play"; controlType="load" }
  TIMELINE t-70ca57e5  (8 actions)
    pos=0 dur=0.45 ease=- tt=2
      targets: wf:class:["agency-hero-text-wrap"] none
      props: {"wf:transform":{"opacity":["0%","100%"],"y":["50px","0px"]}}
    pos=0 dur=0.45 ease=- tt=2
      targets: wf:class:["agency-dectlies-wrap"] none
      props: {"wf:transform":{"opacity":["0%","100%"],"y":["50px","0px"]}}
    pos=0 dur=0.45 ease=- tt=2
      targets: wf:class:["hero-intro-section"] none
      props: {"wf:transform":{"opacity":["0%","100%"],"y":["50px","0px"]}}
    pos=0 dur=0.6 ease=- tt=2
      targets: wf:inst:["6a97e757adfa59f93a890071","a60822b7-681c-457d-a15c-849d10517aee"] none
      props: {"wf:transform":{"scale":[0.5,1],"opacity":["0%","100%"]}}
    pos=0 dur=0.4 ease=- tt=2
      targets: wf:inst:["6a97e757adfa59f93a890071","a60822b7-681c-457d-a15c-849d10517aee"] none
      props: {"wf:transform":{"scale":[0.5,1],"opacity":["0%","100%"]}}
    pos=0 dur=0.4 ease=- tt=2
      targets: wf:inst:["6a97e757adfa59f93a890071","e7772b2d-210f-27fe-e69f-61db8be74d89"] none
      props: {"wf:transform":{"scale":[0.5,1],"opacity":["0%","100%"]}}
    pos=0 dur=0.51 ease=- tt=2
      targets: wf:class:["bg-image-left-wrap"] none
      props: {"wf:transform":{"scale":[0,1],"transformOrigin":"0% 100%","opacity":["0%","100%"]}}
    pos=0 dur=0.51 ease=- tt=2
      targets: wf:class:["bg-image-right-wrap"] none
      props: {"wf:transform":{"scale":[0,1],"transformOrigin":"100% 0%","opacity":["0%","100%"]}}
############################################################
INTERACTION i-7963fecb
  conditionalPlayback: null
  TRIGGER: wf:scroll { controlType="scroll"; scrollTriggerConfig={"clamp":false,"start":"top 92%","end":"bottom top","scrub":null,"enter":"play","leave":"none","enterBack":"none","leaveBack":"none"} }
  TIMELINE t-75026cf0  (1 actions)
    pos=0 dur=0.51 ease=- tt=2
      targets: wf:attribute:"[origin-fade-up=\"true\"]" within filterBy=["wf:trigger-only",""]
      props: {"wf:transform":{"opacity":["0%","100%"],"scale":[0,1],"transformOrigin":"100% 0%"}}
