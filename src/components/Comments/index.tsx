import { useEffect } from 'react';

const REPO_NAME =
  'DavidWDiniz/ignite-challenge-05-create-a-project-from-scratch';

export default function Comments(): JSX.Element {
  useEffect(() => {
    const scriptParentNode = document.getElementById('inject-comment');

    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.async = true;
    script.setAttribute('repo', REPO_NAME);
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('label', 'comment :speech_balloon:');
    script.setAttribute('theme', 'photon-dark');
    script.setAttribute('crossorigin', 'anonymous');

    scriptParentNode.appendChild(script);
  }, []);

  return <div id="inject-comment" />;
}
