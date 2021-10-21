import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';
import Comments from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  routing: {
    previousPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
    nextPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
  };
  last_publication_date: string;
  post: Post;
  preview: boolean;
}

export default function Post({
  post,
  routing,
  last_publication_date,
  preview,
}: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const formattedDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  const isPostEdited = post.first_publication_date !== last_publication_date;
  let editedDate;
  if (isPostEdited) {
    editedDate = format(
      new Date(post.first_publication_date),
      "'* editado em' dd MMM yyyy', as' H':'m",
      {
        locale: ptBR,
      }
    );
  }

  const totalWords = post.data.content.reduce((total, item) => {
    let acc = total;
    acc += item.heading.trim().split(/\s+/).length;
    item.body.map(content => {
      acc += content.text.trim().split(/\s+/).length;
      return acc;
    });
    return acc;
  }, 0);

  const readingTime = Math.ceil(totalWords / 200);

  return (
    <>
      <Head>
        <title>{post.data.title} | Space traveling</title>
      </Head>
      <Header />
      <img className={styles.banner} src={post.data.banner.url} alt="banner" />
      <main className={styles.content}>
        <h1>{post.data.title}</h1>
        <div>
          <time>
            <FiCalendar />
            {formattedDate}
          </time>
          <span>
            <FiUser />
            {post.data.author}
          </span>
          <span>
            <FiClock />
            {`${readingTime} min`}
          </span>
        </div>
        {editedDate && <p>{editedDate}</p>}
        {post.data.content.map(content => {
          return (
            <article key={content.heading}>
              <h2>{content.heading}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </article>
          );
        })}

        <section className={styles.routing}>
          {!!routing?.previousPost.length && (
            <div>
              <h3>{routing.previousPost[0].data.title}</h3>
              <Link href={`/post/${routing.previousPost[0].uid}`}>
                <a>Post anterior</a>
              </Link>
            </div>
          )}
          {!!routing?.nextPost.length && (
            <div>
              <h3>{routing.nextPost[0].data.title}</h3>
              <Link href={`/post/${routing.nextPost[0].uid}`}>
                <a>Próximo post</a>
              </Link>
            </div>
          )}
        </section>

        <Comments />

        {preview && (
          <aside>
            <Link href="/api/exit-preview">
              <a className={commonStyles.preview}>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 2,
    }
  );

  const postsPaths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths: postsPaths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const { slug } = params;
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  const previousPost = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.last_publication_date desc]',
    }
  );

  return {
    props: {
      post,
      last_publication_date: response.last_publication_date,
      routing: {
        previousPost: previousPost?.results,
        nextPost: nextPost?.results,
      },
      preview,
    },
  };
};
