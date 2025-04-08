# todo

1. hdri haven under water map 추가
2. glsl 인트로 및 카메라 모션 추가 다크모드 빛 약해지며 주변에 바라보는 눈, 동공 커짐
   PolyHaven, SketchFab
   https://threejs-journey.com/lesson
   groot/works

게임 죽으면 YOU'RE COOKED 메세지

# gallery

https://codesandbox.io/p/sandbox/lx2h8?file=%2Fsrc%2FApp.js%3A103%2C1
바닥 이미지 반사

# 확인 할 것

use client 최소화
페이지 이동 시 메모리 해제
resize debounce
<Suspense fallback={<Loader />}>

수정 전, 수정 후 비교

현재는 카메라가 슬라이드를 가까이 바라보고 슬라이드 버튼으로 이동하게 되어있는데
우측 하단에 freemode 라는 토글 버튼을 추가해서 이 버튼을 누르면 슬라이드들의 사이에서 드래그로 슬라이드를 넘길 수 있도록 해줘
이 부분은 카메라를 rotation해도 되고, 슬라이드를 rotation 해도 좋은데 성능이 좋은쪽으로 변경해줘
