# ⚽ 足球资讯

每天由 Muse 自动收集整理当天足球圈热门资讯（C罗、梅西必收，其他球星、联赛、转会、国足等按热度收），网页上按日期浏览。只收集事实，不做标题和选题策划。

- 在线地址：`https://你的用户名.github.io/football-topics/`
- 数据目录：[`data/`](data/)，每天一个 JSON 文件

## 上线步骤
1. 在 GitHub 新建**公开**仓库 `football-topics`，把本文件夹的全部内容传上去
2. 仓库 Settings → Pages → Source 选 `Deploy from a branch`，分支选 `main` / `(root)`，保存
3. 1~2 分钟后打开 `https://你的用户名.github.io/football-topics/`
4. 生成一个 Fine-grained token（只授权这个仓库，Contents: Read and write），发给 Muse
5. 把 [`MUSE_PROMPT.md`](MUSE_PROMPT.md) 的内容发给 Muse，设为长期 Goal

## 本地预览
```bash
python -m http.server 8000
# 打开 http://localhost:8000
```
