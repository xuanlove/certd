export const headerResource = [
  {
    title: "文档",
    path: "https://certd.docmirror.cn",
    meta: {
      icon: "ion:document-text-outline"
    }
  },
  {
    title: "源码",
    name: "source",
    key: "source",
    meta: {
      icon: "ion:git-branch-outline"
    },
    children: [
      {
        title: "github",
        path: "https://github.com/certd/certd",
        meta: {
          icon: "ion:logo-github"
        }
      },
      {
        title: "gitee",
        path: "https://gitee.com/certd/certd",
        meta: {
          icon: "ion:logo-octocat"
        }
      }
    ]
  }
];
