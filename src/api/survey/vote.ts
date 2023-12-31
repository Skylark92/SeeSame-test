import { db } from 'api/core';
import { arrayUnion, doc, getDoc, runTransaction } from 'firebase/firestore';
import { SurveyData, SurveyResponse } from 'api/type/survey';
import { UserData } from 'api/type/user';

export default async function vote(
  survey: SurveyData,
  user: UserData,
  choice: 'choiceA' | 'choiceB',
): Promise<SurveyResponse> {
  // 사용자의 투표결과 반영

  const response: SurveyResponse = {
    ok: false,
    message: null,
  };

  // 예외 처리
  if (!(survey && user && choice)) {
    response.message = '통신에 필요한 정보가 누락됐습니다.';
    return response;
  }

  if (!user.profile) {
    response.message = '프로필 정보가 없습니다.';
    alert('투표를 위해 프로필 정보를 완성해주세요.');
    window.location.assign('/editprofile');
    return response;
  }

  if (survey.user.includes(user._id)) {
    response.message = '이미 투표한 서베이입니다.';
    return response;
  }

  // 실행
  try {
    const profile = user.profile;
    const surveyRef = doc(db, 'Survey', survey._id); // 서베이 문서
    const userSurveyRef = doc(db, 'User', user._id, 'Survey', survey._id); // 유저 문서 내 서베이 문서

    await runTransaction(db, async (transaction) => {
      const surveyDoc = await transaction.get(surveyRef);
      if (!surveyDoc.exists()) {
        throw new Error('해당 서베이가 존재하지 않습니다.');
      }

      const userSurveyDoc = await transaction.get(userSurveyRef);
      if (userSurveyDoc.exists()) {
        if (userSurveyDoc.data().isVoted) {
          throw new Error('이미 투표한 서베이입니다.');
        }
      }

      // 서베이 문서 통계 업데이트
      const oldData = surveyDoc.data().stats;
      const newData: any = {
        user: arrayUnion(user._id),
      };
      newData['stats.total'] = oldData.total + 1; // 응답 전체 1 추가
      newData[`stats.${choice}.total`] = oldData[choice].total + 1; // 해당 선택지의 총합을 1 추가
      newData[`stats.${choice}.MBTI.${profile.MBTI}`] =
        oldData[choice].MBTI[profile.MBTI] + 1;
      newData[`stats.${choice}.${profile.gender}.${profile.age}`] =
        oldData[choice][profile.gender][profile.age] + 1;

      transaction.update(surveyRef, newData);

      // 유저 문서 내 서베이 문서 추가
      const { stats, ...rest } = survey;
      const userSurveyData = {
        ...rest,
        choice,
        isVoted: true,
        votedAt: new Date(),
      };

      transaction.update(doc(db, 'User', user._id), {
        survey: arrayUnion(userSurveyData),
      });

      transaction.set(userSurveyRef, userSurveyData, { merge: true }); // merge 옵션, 문서가 존재하는 경우 덮어 쓰지 않고 병합
    });

    const latestSurvey = await getDoc(surveyRef);

    response.ok = true;
    if (latestSurvey.exists()) {
      response.survey = latestSurvey.data() as SurveyData;
    } else {
      throw new Error('최신 정보를 불러오는데 실패했습니다.');
    }

    return response;
  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      response.message = error.message;
    }

    return response;
  }
}
