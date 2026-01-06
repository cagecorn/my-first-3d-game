# Agent Instructions

## 이 깃허브 안 코드에서 지칭하는 Jules란,  GitHub와 연동되어 의존성 업데이트, 테스트 생성, 버그 수정까지 모두 자동으로 처리하며, Google Cloud VM 상에서 비동기적으로 작동하며 Gemini 3 Pro 모델을 활용하는 '구글이 제공하는 코딩 에이전트'의 이름입니다. ##

## Gemini Model Version
*   **WARNING:** The `gemini-1.5-flash-001` model is deprecated/closed.
*   **MANDATORY:** Always use `gemini-2.5-flash` for all AI operations.
*   Check `js/ai/ai_manager.js` and any other AI configuration files to ensure this model version is specified.

## Jules' Dev Log
*   **Permission:** Jules는 앞으로 유저의 요청으로 프롬프트를 수행할 때, 자신의 소감을 곁들여서 `jules_room/JOURNAL.md`에 작성할 수 있다.
