# Test Long String Wrapping

This file contains test cases for the long string wrapping fix in Issue #22.

## Test Case 1: Japanese text with long lines
折返し表示したほうが良い。

日本語は折り返される。

## Test Case 2: Long continuous string without spaces
aabbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb1

## Test Case 3: Business content (from issue description)
■業務内容：FinTechで自社サービス「e-SCOTT」 クラウドインフラ基盤の企画・設計構築から運用まで幅広くご担当いただきます。生活インフラを担当する弊社では、クレジットカード決済のオンライン処理を担う、高速処理、高可用性が求められるシステムの構築・運用を行うことができます。サーバやネットワークの構成検討から構築、運用、改善まですべてに携われ、自社システム構築運用ならではの幅広いスキルを身に着けることができます。また、決済ならではのPCIDSS準拠のセキュアな環境構築などが学べます。

## Test Case 4: Very long URL or path
https://very-long-domain-name-that-should-wrap-when-displayed-in-diff-view.example.com/very/long/path/to/some/resource/that/keeps/going/and/going/until/it/becomes/unreasonably/long/for/normal/display/purposes

## Test Case 5: Code with long variable names
const veryLongVariableNameThatShouldWrapProperlyInDiffViewWhenDisplayedToTheUserToPreventOverflowIssues = "some value";

## Test Case 6: Mixed content
Short line.
この行は日本語で書かれていて、とても長い文章になっているので、差分表示の際に適切に折り返されるかどうかをテストするために使用されます。これは Issue #22 の修正をテストするためのサンプルテキストです。
Another short line.
verylonglinewithoutanybrakespacesorcharacterstobreakonthatwillforcethelinetoextendbeyondthenormalwidthofthediffviewerandshouldbewrappedproperly
Final short line.