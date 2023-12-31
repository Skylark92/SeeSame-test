import { db } from 'api/core';
import { SurveyData } from 'api/type/survey';
import { UserData } from 'api/type/user';
import {
  DocumentReference,
  collection,
  getDoc,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';

export default async function getComments(
  survey: SurveyData,
): Promise<unknown[]> {
  // 서베이 전체 목록 가져오기

  const commentList: unknown[] = [];
  const q = query(
    collection(db, 'Survey', survey._id, 'Comment'),
    orderBy('createdAt'), // 'like'
  );
  const snapshot = await getDocs(q);

  for await (const doc of snapshot.docs) {
    const data = doc.data();

    if (data.author) {
      if (!(data.author instanceof DocumentReference)) {
        // author가 참조형이 아닐 경우 통과
        continue;
      }
      // 참조할 게 있으면
      const docSnap = await getDoc(data.author);

      if (docSnap?.exists()) {
        const user = docSnap.data() as UserData;
        data.author = {
          _id: user._id,
          userid: user.userid,
          profile: user.profile,
        };

        commentList.push(data);
      } else
        console.log(
          `유저 정보를 불러오는 데 실패했습니다. (Comment ID : ${data.id})`,
        );
    }
  }

  return commentList;
}
